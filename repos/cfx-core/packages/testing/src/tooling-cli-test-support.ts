import { vi } from 'vitest';

export function resetToolingCliAgentNamespaceHarness(harness: {
  prompts?: { input?: { mockClear: () => void }; select?: { mockClear: () => void } };
  llmClient?: Record<string, { mockClear?: () => void }>;
  llmAgents?: Record<string, { mockClear?: () => void }>;
  piAgent?: Record<string, { mockClear?: () => void }>;
}): void {
  vi.restoreAllMocks();
  delete process.env.CFXDEVKIT_LLM_CONFIG_PATH;
  harness.prompts?.input?.mockClear();
  harness.prompts?.select?.mockClear();

  for (const group of [harness.llmClient, harness.llmAgents, harness.piAgent]) {
    for (const mock of Object.values(group ?? {})) {
      mock.mockClear?.();
    }
  }
}

export async function withMockedTty<T>(
  work: () => Promise<T> | T,
  options: { stdin?: boolean; stdout?: boolean } = {},
): Promise<T> {
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    value: options.stdin ?? true,
  });
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value: options.stdout ?? true,
  });

  try {
    return await work();
  } finally {
    if (stdinDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor);
    }
    if (stdoutDescriptor) {
      Object.defineProperty(process.stdout, 'isTTY', stdoutDescriptor);
    }
  }
}
