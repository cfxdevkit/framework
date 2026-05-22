import { relative } from 'node:path';
import {
  configPath,
  configPathEnvVar,
  findMonorepoUnitByConfigPath,
  getProviderBaseUrl,
  getProviderDefaultModel,
  readConfig,
  resolveProvider,
  resolveProviderModel,
} from '../completion/index.ts';
import { logInfo } from './logging.ts';

export type ExecutionContextSummary = {
  unit: {
    name: string;
    rootDir: string;
    configPath: string;
  } | null;
  llm: {
    used: boolean;
    status: 'not-used' | 'ready' | 'unavailable';
    configPath: string;
    provider?: string;
    baseUrl?: string | null;
    model?: string | null;
    error?: string;
  };
};

export type ExecutionContextRuntimePayload = ExecutionContextSummary;

export async function resolveExecutionContext(options: {
  useLlm: boolean;
  action?: string;
  modelOverride?: string | null;
}): Promise<ExecutionContextSummary> {
  const activeConfigPath = process.env[configPathEnvVar] ?? configPath;
  const relativeConfig = relative(process.cwd(), activeConfigPath) || activeConfigPath;
  const unit = findMonorepoUnitByConfigPath(activeConfigPath, process.cwd());
  const summary: ExecutionContextSummary = {
    unit: unit
      ? {
          name: unit.name,
          rootDir: unit.rootDir,
          configPath: unit.relativeConfigPath,
        }
      : null,
    llm: {
      used: options.useLlm,
      status: options.useLlm ? 'unavailable' : 'not-used',
      configPath: relativeConfig,
    },
  };

  if (!options.useLlm) return summary;

  try {
    const config = await readConfig();
    const provider = await resolveProvider();
    const model = await resolveProviderModel(
      provider,
      options.modelOverride ??
        (options.action ? config.actions?.[options.action] : null) ??
        config.defaultModel ??
        getProviderDefaultModel(provider),
    );
    return {
      ...summary,
      llm: {
        ...summary.llm,
        status: 'ready',
        provider: provider.type,
        baseUrl: getProviderBaseUrl(provider),
        model,
      },
    };
  } catch (error) {
    return {
      ...summary,
      llm: {
        ...summary.llm,
        status: 'unavailable',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function renderExecutionContextLines(context: ExecutionContextSummary): string[] {
  const unitLabel = context.unit
    ? `${context.unit.name} (${context.unit.rootDir})`
    : 'shared repo config';
  const llmLabel =
    context.llm.status === 'not-used'
      ? 'not used'
      : context.llm.status === 'ready'
        ? `${context.llm.provider} :: ${context.llm.model ?? 'auto'}${context.llm.baseUrl ? ` @ ${context.llm.baseUrl}` : ''}`
        : `unavailable${context.llm.error ? ` (${context.llm.error})` : ''}`;

  return [
    'Execution context:',
    `  - unit: ${unitLabel}`,
    `  - config: ${context.llm.configPath}`,
    `  - llm: ${llmLabel}`,
  ];
}

export function logExecutionContext(context: ExecutionContextSummary): void {
  for (const line of renderExecutionContextLines(context)) {
    logInfo(line);
  }
}

export function toExecutionContextRuntimePayload(
  context: ExecutionContextSummary,
): ExecutionContextRuntimePayload {
  return context;
}
