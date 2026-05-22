import { printConfigHelp } from './agent-help.js';
import {
  ensureActionPolicies,
  ensureProviderProfiles,
  printActionPolicy,
  printProviderProfile,
  printProviderProfiles,
} from './agent-config-details.js';
import {
  formatBoolean,
  isHelpToken,
  parseBoolean,
  relativeConfigPath,
  withLlmAgents,
  withLlmClient,
} from './agent-runtime.js';

export async function runConfigCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  const [subcommand = 'show', key, ...rest] = args;
  const value = rest[0];
  if (isHelpToken(subcommand)) {
    printConfigHelp();
    return;
  }

  if (subcommand === 'show') {
    if (key === 'profiles') {
      await printProviderProfiles();
      return;
    }
    if (key === 'profile') {
      await printProviderProfile(rest[0]);
      return;
    }
    if (key === 'action-policy') {
      await printActionPolicy(rest[0], rest[1]);
      return;
    }
    console.log(JSON.stringify(await withLlmClient((client) => client.readConfig()), null, 2));
    return;
  }

  if (subcommand === 'reset') {
    await withLlmClient((client) => client.writeConfig(client.defaultConfig()));
    console.log(`Reset ${relativeConfigPath()}`);
    return;
  }

  if (subcommand !== 'set') {
    printConfigHelp();
    return;
  }

  if (
    key === 'provider' ||
    key === 'base-url' ||
    key === 'default-model' ||
    key === 'request-timeout-ms' ||
    key === 'action'
  ) {
    await withLlmAgents((agents) => agents.configure(['set', key, ...rest]));
    return;
  }

  const config = await withLlmClient((client) => client.readConfig());
  if (key === 'mode') {
    if (value !== 'deterministic' && value !== 'exploratory') {
      throw new Error('mode must be deterministic or exploratory');
    }
    config.harness.defaultMode = value;
  } else if (key === 'provider-strategy') {
    if (value !== 'auto' && value !== 'gateway' && value !== 'direct') {
      throw new Error('provider-strategy must be auto, gateway, or direct');
    }
    config.harness.providerStrategy = value;
  } else if (key === 'preserve-deterministic-artifacts') {
    config.harness.deterministic.preserveDeterministicArtifacts = parseBoolean(value, key);
  } else if (key === 'preserve-deterministic-sections') {
    config.harness.deterministic.preserveDeterministicSections = parseBoolean(value, key);
  } else if (key === 'exploratory-code-changes') {
    config.harness.exploratory.allowCodeChanges = parseBoolean(value, key);
  } else if (key === 'exploratory-wide-changes') {
    config.harness.exploratory.allowWideChanges = parseBoolean(value, key);
  } else if (key === 'profile-provider') {
    const [profileName, provider] = rest;
    if (!profileName) throw new Error('Usage: cdk agent config set profile-provider <name> <provider>');
    if (
      provider !== 'lemonade' &&
      provider !== 'litellm' &&
      provider !== 'openai-compat' &&
      provider !== 'github-models'
    ) {
      throw new Error('profile-provider must be lemonade, litellm, openai-compat, or github-models');
    }
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      provider,
    };
  } else if (key === 'profile-base-url') {
    const [profileName, baseUrl] = rest;
    if (!profileName || !baseUrl) {
      throw new Error('Usage: cdk agent config set profile-base-url <name> <url>');
    }
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      baseUrl,
    };
  } else if (key === 'profile-default-model') {
    const [profileName, defaultModel] = rest;
    if (!profileName || !defaultModel) {
      throw new Error('Usage: cdk agent config set profile-default-model <name> <id>');
    }
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      defaultModel,
    };
  } else if (key === 'profile-strategy') {
    const [profileName, strategy] = rest;
    if (!profileName) {
      throw new Error('Usage: cdk agent config set profile-strategy <name> <auto|gateway|direct>');
    }
    if (strategy !== 'auto' && strategy !== 'gateway' && strategy !== 'direct') {
      throw new Error('profile-strategy must be auto, gateway, or direct');
    }
    ensureProviderProfiles(config)[profileName] = {
      ...(config.providerProfiles?.[profileName] ?? {}),
      providerStrategy: strategy,
    };
  } else if (key === 'action-policy') {
    const [actionName, profileName] = rest;
    if (!actionName || !profileName) {
      throw new Error('Usage: cdk agent config set action-policy <action> <profile>');
    }
    ensureActionPolicies(config)[actionName] = {
      ...(config.actionPolicies?.[actionName] ?? {}),
      profile: profileName,
      phases: config.actionPolicies?.[actionName]?.phases ?? {},
    };
  } else if (key === 'phase-policy') {
    const [actionName, phaseName, profileName] = rest;
    if (!actionName || !phaseName || !profileName) {
      throw new Error('Usage: cdk agent config set phase-policy <action> <phase> <profile>');
    }
    const actionPolicy = ensureActionPolicies(config)[actionName] ?? {};
    ensureActionPolicies(config)[actionName] = {
      ...actionPolicy,
      phases: {
        ...(actionPolicy.phases ?? {}),
        [phaseName]: {
          ...(actionPolicy.phases?.[phaseName] ?? {}),
          profile: profileName,
        },
      },
    };
  } else {
    throw new Error(
      'Config keys: mode, provider-strategy, preserve-deterministic-artifacts, preserve-deterministic-sections, exploratory-code-changes, exploratory-wide-changes, profile-provider, profile-base-url, profile-default-model, profile-strategy, action-policy, phase-policy',
    );
  }

  await withLlmClient((client) => client.writeConfig(config));
  console.log(`Updated ${relativeConfigPath()}`);
}

export async function printStatus(): Promise<void> {
  const config = await withLlmClient((client) => client.readConfig());
  try {
    const provider = await withLlmClient((client) => client.resolveProvider());
    const [models, resolvedModel] = await Promise.all([
      provider.discoverModels(),
      withLlmClient((client) =>
        client.resolveProviderModel(
          provider,
          config.defaultModel ?? client.getProviderDefaultModel(provider),
        ),
      ),
    ]);

    const baseUrl = await withLlmClient((client) => client.getProviderBaseUrl(provider));
    const providerDefaultModel = await withLlmClient((client) =>
      client.getProviderDefaultModel(provider),
    );

    console.log(`cdk agent status

Scope:
  - config: ${relativeConfigPath()}

Mode:
  - default mode: ${config.harness.defaultMode}
  - provider strategy: ${config.harness.providerStrategy}

Configured backend:
  - provider: ${config.provider ?? 'auto'}
  - baseUrl: ${config.baseUrl ?? 'auto'}
  - defaultModel: ${config.defaultModel ?? 'auto'}

Policy registry:
  - provider profiles: ${Object.keys(config.providerProfiles ?? {}).length}
  - action policies: ${Object.keys(config.actionPolicies ?? {}).length}

Resolved backend:
  - provider: ${provider.type}
  - baseUrl: ${baseUrl || 'n/a'}
  - provider default model: ${providerDefaultModel ?? 'n/a'}
  - resolved model: ${resolvedModel}
  - discovered models: ${models.length}

Notes:
  - Lemonade is a supported first-class direct provider option for local server use.
  - LiteLLM remains the optional gateway path when shared routing or observability is needed.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`cdk agent status

Scope:
  - config: ${relativeConfigPath()}

Mode:
  - default mode: ${config.harness.defaultMode}
  - provider strategy: ${config.harness.providerStrategy}

Configured backend:
  - provider: ${config.provider ?? 'auto'}
  - baseUrl: ${config.baseUrl ?? 'auto'}
  - defaultModel: ${config.defaultModel ?? 'auto'}

Policy registry:
  - provider profiles: ${Object.keys(config.providerProfiles ?? {}).length}
  - action policies: ${Object.keys(config.actionPolicies ?? {}).length}

Resolved backend:
  - status: unavailable
  - error: ${message}`);
  }
}

export async function printModes(): Promise<void> {
  const config = await withLlmClient((client) => client.readConfig());
  console.log(`cdk agent operating modes

Config path: ${relativeConfigPath()}

Active default mode: ${config.harness.defaultMode}

Deterministic mode:
  - preserve deterministic artifacts: ${formatBoolean(config.harness.deterministic.preserveDeterministicArtifacts)}
  - preserve deterministic sections: ${formatBoolean(config.harness.deterministic.preserveDeterministicSections)}
  - intended for constrained enrichment layered on deterministic outputs

Exploratory mode:
  - allow code changes: ${formatBoolean(config.harness.exploratory.allowCodeChanges)}
  - allow wide changes: ${formatBoolean(config.harness.exploratory.allowWideChanges)}
  - intended for repo maintenance, broader refactors, and agent-driven code work

Shared backend policy:
  - provider strategy: ${config.harness.providerStrategy}
  - provider profiles: ${Object.keys(config.providerProfiles ?? {}).length}
  - action policies: ${Object.keys(config.actionPolicies ?? {}).length}
  - cdk agent sits above both LiteLLM gateways and direct providers`);
}

export async function printInteractiveMode(): Promise<void> {
  const config = await withLlmClient((client) => client.readConfig());
  console.log(`cdk agent interactive

Config path:
  - ${relativeConfigPath()}

Current role:
  - route into the current llm-agents workflow layer without moving packages yet
  - use the shared harness default mode to choose deterministic or exploratory behavior
  - provide one stable cdk entrypoint while the old llm surface enters deprecation

Current status:
  - default mode: ${config.harness.defaultMode}
  - provider strategy: ${config.harness.providerStrategy}
  - constrained workflows route through \
    cdk agent deterministic <models|validate-models|precommit|docs-api|docs-api-probe|readme-upkeep|package-pages|structure-upkeep|docs-upkeep>
  - broader workflows route through \
    cdk agent exploratory <print|ask|review|all|test-upkeep|commit|actions|action|test-audit|health|validation|changeset|release|ci-cd|docs-pipeline>

Next backend:
  - replace this mode router with a pi-backed TUI/runtime while keeping the same cdk taxonomy.`);
}
