import { formatBoolean, withLlmClient } from '../agent/runtime.js';

export async function printProviderProfiles(): Promise<void> {
  const config = await withLlmClient((client) => client.readConfig());
  const names = Object.keys(config.providerProfiles ?? {}).sort((left, right) =>
    left.localeCompare(right),
  );

  if (names.length === 0) {
    console.log('cdk agent config profiles\n\nNo provider profiles configured.');
    return;
  }

  const lines = await Promise.all(
    names.map(async (name) => {
      const profile = await withLlmClient((client) =>
        client.resolveNamedProviderProfile(config, name),
      );
      return `  - ${name}: provider ${profile.provider ?? 'auto'} | model ${profile.defaultModel ?? 'auto'} | strategy ${profile.providerStrategy}`;
    }),
  );

  console.log(`cdk agent config profiles

Configured provider profiles:
${lines.join('\n')}`);
}

export async function printProviderProfile(profileName: string | undefined): Promise<void> {
  if (!profileName) {
    throw new Error('Usage: cdk agent config show profile <name>');
  }

  const config = await withLlmClient((client) => client.readConfig());
  const profile = await withLlmClient((client) =>
    client.resolveNamedProviderProfile(config, profileName),
  );

  console.log(`cdk agent config profile ${profileName}

Profile:
  - exists: ${formatBoolean(profile.exists)}
  - provider: ${profile.provider ?? 'auto'}
  - baseUrl: ${profile.baseUrl ?? 'auto'}
  - default model: ${profile.defaultModel ?? 'auto'}
  - github model: ${profile.githubModel ?? 'auto'}
  - request timeout ms: ${profile.requestTimeoutMs ?? 'auto'}
  - strategy: ${profile.providerStrategy}`);
}

export async function printActionPolicy(
  actionName: string | undefined,
  phaseName?: string,
): Promise<void> {
  if (!actionName) {
    throw new Error('Usage: cdk agent config show action-policy <action> [phase]');
  }

  const state = await withLlmClient((client) =>
    client.resolveRuntimeBridgeState(
      undefined,
      phaseName ? { action: actionName, phase: phaseName } : { action: actionName },
    ),
  );
  const effective = state.effectivePolicy;

  console.log(`cdk agent config action-policy ${actionName}${phaseName ? ` ${phaseName}` : ''}

Effective policy:
  - source: ${effective.source}
  - profile: ${effective.profile.name ?? 'default'}
  - profile exists: ${formatBoolean(effective.profile.exists)}
  - provider: ${effective.profile.provider ?? 'auto'}
  - model: ${effective.model ?? 'auto'}
  - legacy action model: ${effective.legacyActionModel ?? 'none'}
  - strategy: ${effective.profile.providerStrategy}`);
}

export function ensureProviderProfiles(config: {
  providerProfiles?: Record<string, Record<string, unknown>>;
}): Record<string, Record<string, unknown>> {
  config.providerProfiles ??= {};
  return config.providerProfiles;
}

export function ensureActionPolicies(config: {
  actionPolicies?: Record<
    string,
    {
      profile?: string | null;
      model?: string | null;
      phases?: Record<string, Record<string, unknown>>;
    }
  >;
}): Record<
  string,
  {
    profile?: string | null;
    model?: string | null;
    phases?: Record<string, Record<string, unknown>>;
  }
> {
  config.actionPolicies ??= {};
  return config.actionPolicies;
}
