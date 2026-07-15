import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverApiTargets } from '@cfxdevkit/docs-pipeline';
import { completeStructuredAgent, parseJsonObject } from '../../completion/index.js';
import { root } from '../../shared/index.js';
import { logInfo, logStep } from '../../shared/logging.js';
import { type DocFlags as DocsApiFlags, parseDocFlags as parseDocsApiFlags } from '../flags.js';

type DocsApiProbeResult = {
  status: string;
  package: string;
  firstHeading: string;
  hasTsFence: boolean;
};

export function parseDocsApiProbeResponse(content: string): DocsApiProbeResult {
  const raw = content.trim();
  const lineMatch = raw
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^OK\|/.test(line));

  if (lineMatch) {
    const [, pkg, heading, hasTsFenceToken] =
      lineMatch.match(/^OK\|([^|]+)\|([^|]+)\|(yes|no)$/i) ?? [];
    if (pkg && heading && hasTsFenceToken) {
      return {
        status: 'ok',
        package: pkg.trim(),
        firstHeading: heading.trim(),
        hasTsFence: hasTsFenceToken.toLowerCase() === 'yes',
      };
    }
  }

  try {
    const parsed = parseJsonObject(raw) as Partial<DocsApiProbeResult>;
    if (
      typeof parsed.status === 'string' &&
      typeof parsed.package === 'string' &&
      typeof parsed.firstHeading === 'string' &&
      typeof parsed.hasTsFence === 'boolean'
    ) {
      return {
        status: parsed.status.trim(),
        package: parsed.package.trim(),
        firstHeading: parsed.firstHeading.trim(),
        hasTsFence: parsed.hasTsFence,
      };
    }
  } catch {
    // fall through to final error
  }

  throw new Error(`Invalid docs-api probe response: ${raw.slice(0, 160)}`);
}

async function callDocsApiProbe(
  pkg: { name?: string; rel: string },
  apiContent: string,
  flags: DocsApiFlags,
): Promise<{ result: DocsApiProbeResult; model: string; baseUrl: string }> {
  const snippet = apiContent
    .split('\n')
    .slice(0, flags.quick ? 24 : 40)
    .join('\n');
  const systemPrompt = [
    'You are validating a TypeScript API documentation enrichment pipeline.',
    'Return exactly one line using this format and nothing else:',
    'OK|<package-name>|<first-markdown-heading>|<yes-or-no-for-ts-fence>',
    'Use only the provided snippet. Do not invent anything.',
  ].join(' ');
  const userPrompt = [
    `Package: ${pkg.name ?? pkg.rel}`,
    `Workspace path: ${pkg.rel}`,
    '',
    'Return whether the snippet looks like a valid API.md skeleton and echo the first markdown heading.',
    '',
    'API.md snippet:',
    snippet,
  ].join('\n');

  const attempt = async (invalidResponse?: string) =>
    completeStructuredAgent({
      action: 'docs-api',
      flags,
      systemPrompt: invalidResponse
        ? `${systemPrompt} The previous response was invalid. Return exactly one JSON object.`
        : systemPrompt,
      userPrompt: invalidResponse
        ? ['Previous invalid response:', invalidResponse.slice(0, 400), '', userPrompt].join('\n')
        : userPrompt,
      maxTokens: flags.quick ? 120 : 220,
    });

  const response = await attempt();
  try {
    return {
      result: parseDocsApiProbeResponse(response.content),
      model: response.model,
      baseUrl: response.baseUrl,
    };
  } catch {
    const retryResponse = await attempt(response.content);
    return {
      result: parseDocsApiProbeResponse(retryResponse.content),
      model: retryResponse.model,
      baseUrl: retryResponse.baseUrl,
    };
  }
}

export async function runDocsApiProbe(args: string[]): Promise<void> {
  if (args[0] === '--') args.shift();
  const flags = parseDocsApiFlags(args);
  const total = 2;

  logStep(1, total, 'Discovering package for API enrichment probe');
  const packages = await discoverApiTargets({ packageName: flags.package });
  const pkg = packages[0];
  if (!pkg) {
    throw new Error(
      flags.package
        ? `No API enrichment target matched package ${flags.package}`
        : 'No API enrichment targets found.',
    );
  }
  logInfo(`  probing ${pkg.rel}`);

  logStep(2, total, 'LLM probe');
  const apiPath = join(root, pkg.rel, 'API.md');
  const apiContent = await readFile(apiPath, 'utf8');
  const { result, model, baseUrl } = await callDocsApiProbe(pkg, apiContent, flags);
  logInfo(`  [ok] ${pkg.rel}`);
  logInfo(`  model: ${model}`);
  logInfo(`  baseUrl: ${baseUrl}`);
  logInfo(`  firstHeading: ${result.firstHeading}`);
  logInfo(`  hasTsFence: ${String(result.hasTsFence)}`);
}

export async function precheckDocsApi(
  pkg: { name?: string; rel: string },
  flags: DocsApiFlags,
): Promise<void> {
  const apiPath = join(root, pkg.rel, 'API.md');
  const apiContent = await readFile(apiPath, 'utf8');
  const { result, model } = await callDocsApiProbe(pkg, apiContent, flags);
  if (result.status !== 'ok') {
    throw new Error(`Probe returned non-ok status for ${pkg.rel}: ${result.status}`);
  }
  logInfo(`  ✓ precheck ok for ${pkg.rel} via ${model}`);
}
