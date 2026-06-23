import { format } from 'node:util';

export async function withCapturedConsole<T>(
  work: () => Promise<T>,
): Promise<{ result: T; logs: readonly string[] }> {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console methods
  const sink = (...args: unknown[]) => {
    logs.push(format(...args));
  };
  console.log = sink;
  console.warn = sink;
  console.error = sink;

  try {
    const result = await work();
    return { result, logs };
  } finally {
    // Restore original methods
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}
