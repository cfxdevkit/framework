import { input, select } from '@inquirer/prompts';
import { listMonorepoUnits } from './monorepo-units.js';

type PiSessionKind = 'interactive' | 'commit';
type PiSessionEndpoint = 'local' | 'github';

type PromptApi = {
  readonly input: typeof input;
  readonly select: typeof select;
};

export type PiSessionSetupResult = {
  readonly scope?: string;
  readonly promptArgs?: readonly string[];
  readonly endpoint?: PiSessionEndpoint;
};

export async function resolvePiSessionSetup(options: {
  kind: PiSessionKind;
  scope?: string;
  endpoint?: PiSessionEndpoint;
  promptArgs: readonly string[];
  stdin?: Pick<NodeJS.ReadStream, 'isTTY'>;
  stdout?: Pick<NodeJS.WriteStream, 'isTTY'>;
  prompts?: PromptApi;
}): Promise<PiSessionSetupResult | null> {
  const stdin = options.stdin ?? process.stdin;
  const stdout = options.stdout ?? process.stdout;
  const promptArgs = normalizePromptArgs(options.promptArgs);
  if (promptArgs.length > 0 || stdin.isTTY !== true || stdout.isTTY !== true) {
    return {
      ...(options.scope ? { scope: options.scope } : {}),
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      ...(promptArgs.length > 0 ? { promptArgs } : {}),
    };
  }

  const prompts = options.prompts ?? { input, select };

  try {
    const endpoint = options.endpoint ?? (await promptForEndpoint(prompts));
    const scope = options.scope ?? (await promptForScope(prompts));
    const context = await prompts.input(
      {
        message: describeSessionContextPrompt(options.kind, endpoint, scope),
      },
      { clearPromptOnDone: true },
    );

    const nextPromptArgs = normalizePromptArgs([context]);
    return {
      ...(endpoint ? { endpoint } : {}),
      ...(scope ? { scope } : {}),
      ...(nextPromptArgs.length > 0 ? { promptArgs: nextPromptArgs } : {}),
    };
  } catch (error) {
    if (isPromptExit(error)) {
      process.exitCode = 1;
      return null;
    }
    throw error;
  }
}

async function promptForScope(prompts: PromptApi): Promise<string | undefined> {
  const units = listMonorepoUnits();
  return await prompts.select(
    {
      message: 'Session preset (shared default or targeted preload)',
      choices: [
        {
          value: '',
          name: 'shared repo harness · full repo',
          description:
            'Uses artifacts/llm/config/llm.json; keeps the monorepo baseline with cdk, OpenSpec, and GitNexus rules active by default.',
        },
        ...units.map((unit) => ({
          value: unit.name,
          name: `${unit.name} · ${unit.defaultMode} preset`,
          description: `Loads ${normalizeChoicePath(unit.relativeConfigPath)}; ${unit.sessionEffect}`,
        })),
      ],
    },
    { clearPromptOnDone: true },
  );
}

async function promptForEndpoint(prompts: PromptApi): Promise<PiSessionEndpoint> {
  return await prompts.select(
    {
      message: 'Session endpoint (local planning or GitHub implementation)',
      choices: [
        {
          value: 'local',
          name: 'local · Lemonade planning endpoint',
          description: 'Use the local model/runtime path for repo planning, preparation, and review.',
        },
        {
          value: 'github',
          name: 'github · cloud implementation endpoint',
          description: 'Use the authenticated GitHub Models PI path for remote review and implementation work.',
        },
      ],
    },
    { clearPromptOnDone: true },
  );
}

function describeSessionContextPrompt(
  kind: PiSessionKind,
  endpoint: PiSessionEndpoint,
  scope?: string,
): string {
  const target = scope ? `${scope} preset` : 'shared repo';
  const endpointLabel = endpoint === 'github' ? 'GitHub endpoint' : 'local endpoint';
  return kind === 'commit'
    ? `Commit session context for ${target} on ${endpointLabel} (optional)`
    : `Session prompt or context for ${target} on ${endpointLabel} (optional)`;
}

function normalizeChoicePath(value: string): string {
  return value.replace(/\\/g, '/');
}

function normalizePromptArgs(promptArgs: readonly string[]): string[] {
  return promptArgs.map((value) => value.trim()).filter(Boolean);
}

function isPromptExit(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}
