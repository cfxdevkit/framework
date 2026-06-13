import { getProviderBaseUrl, readConfig, resolveProvider } from './completion/index.ts';
import { runValidationProbe } from './validate-models/probe';
import {
  displayModelId,
  displayModelLabels,
  findValidationError,
  type ModelValidationResult,
  parseValidateModelsFlags,
  renderValidationTable,
  summarizeValidationResult,
  type ValidationReport,
  validateJsonProbe,
  writeModelValidationReport,
} from './validate-models/report';

const MIN_VALIDATION_CONTEXT_TOKENS = 30000;

export async function validateModels(args: string[]): Promise<void> {
  const flags = parseValidateModelsFlags(args[0] === '--' ? args.slice(1) : args);
  const provider = await resolveProvider();
  const config = await readConfig();
  const minContextTokens =
    provider.type === 'litellm' || provider.type === 'openai-compat'
      ? MIN_VALIDATION_CONTEXT_TOKENS
      : null;
  const discoverStartedAt = Date.now();
  const models = await provider.discoverModels();
  const discoverMs = Date.now() - discoverStartedAt;
  const selectedModels = models
    .filter((model) => !flags.model || displayModelId(model) === flags.model)
    .slice(0, flags.limit);

  if (!selectedModels.length) {
    throw new Error(
      flags.model
        ? `No discovered model matched ${flags.model}.`
        : 'No models discovered from the resolved provider. Check base URL, credentials, and provider compatibility.',
    );
  }

  console.log(`LLM provider: ${provider.type}`);
  console.log(`Base URL: ${getProviderBaseUrl(provider) || 'n/a'}`);
  console.log(`Discovered models: ${models.length} in ${discoverMs}ms`);
  console.log(`Validating models: ${selectedModels.length}`);
  if (minContextTokens) {
    console.log(`Minimum context hint: ${minContextTokens} tokens`);
  }

  const results: ModelValidationResult[] = [];
  for (const model of selectedModels) {
    const modelId = displayModelId(model);
    const labels = displayModelLabels(model);
    console.log(`\nProbing ${modelId}${labels ? ` [${labels}]` : ''}...`);

    const cold = await runValidationProbe({
      provider,
      config,
      action: 'validate-models-cold',
      model: modelId,
      prompt: 'Reply with exactly OK.',
      maxTokens: flags.quick ? 32 : 64,
      quick: flags.quick,
      enableThinking: flags.noThinking ? false : undefined,
      minContextTokens,
    });
    console.log(`  cold: ${summarizeValidationResult({ model: modelId, ...cold })}`);

    const hot = await runValidationProbe({
      provider,
      config,
      action: 'validate-models-hot',
      model: modelId,
      prompt: 'Reply with exactly OK.',
      maxTokens: flags.quick ? 32 : 64,
      quick: flags.quick,
      enableThinking: flags.noThinking ? false : undefined,
      minContextTokens,
    });
    console.log(`  hot:  ${summarizeValidationResult({ model: modelId, ...hot })}`);

    const json = await runValidationProbe({
      provider,
      config,
      action: 'validate-models-json',
      model: modelId,
      prompt: 'Reply with only minified JSON and no other text: {"ok":true,"mode":"json"}',
      maxTokens: flags.quick ? 96 : 160,
      quick: flags.quick,
      enableThinking: flags.noThinking ? false : undefined,
      minContextTokens,
      validate: validateJsonProbe,
    });
    console.log(`  json: ${summarizeValidationResult({ model: modelId, ...json })}`);

    const result: ModelValidationResult = {
      model: modelId,
      labels: model.labels ?? [],
      size: model.size ?? null,
      ok: Boolean(cold.ok && hot.ok && json.ok && json.jsonShapeOk),
      loadMs: cold.headersMs,
      firstResponseMs: cold.firstResponseMs,
      hotFirstResponseMs: hot.firstResponseMs,
      jsonValid: json.jsonValid ?? false,
      jsonShapeOk: json.jsonShapeOk ?? false,
      requestedMinContextTokens: minContextTokens,
      reasoningObserved: Boolean(
        cold.reasoningObserved || hot.reasoningObserved || json.reasoningObserved,
      ),
      headersMs: cold.headersMs,
      firstReasoningMs: cold.firstReasoningMs,
      firstContentMs: cold.firstContentMs,
      completeMs: cold.completeMs,
      finishReason: cold.finishReason,
      contentChars: cold.contentChars,
      reasoningChars: cold.reasoningChars,
      contentPreview: cold.contentPreview,
      cold,
      hot,
      json,
      error: null,
    };
    result.error = findValidationError(result);
    results.push(result);
  }

  const report: ValidationReport = {
    generatedAt: new Date().toISOString(),
    provider: provider.type,
    baseUrl: getProviderBaseUrl(provider),
    discoverMs,
    noThinking: flags.noThinking,
    quick: flags.quick,
    minContextTokens,
    results,
  };
  const reportPath = await writeModelValidationReport(report);
  console.log(`\nComparison:`);
  console.log(renderValidationTable(results));
  console.log(`\nreport: ${reportPath}`);
}
