import type { CompletionProgressEvent } from '../completion/index.ts';

export function logStep(n, total, label) {
  console.log(`\n[${n}/${total}] ${label}`);
}

export function logInfo(msg) {
  console.log(msg);
}

export function createLlmProgressReporter(label: string) {
  return (event: CompletionProgressEvent) => {
    const elapsedSeconds = Math.max(1, Math.round(event.elapsedMs / 1000));
    if (event.phase === 'request') {
      logInfo(`    [llm] request sent for ${label}`);
      return;
    }
    if (event.phase === 'headers') {
      logInfo(
        `    [llm] endpoint responded with status ${event.status ?? 'unknown'} after ${elapsedSeconds}s`,
      );
      return;
    }
    if (event.phase === 'reasoning') {
      logInfo(
        `    [llm] model is reasoning... (${event.reasoningChars ?? 0} chars, ${elapsedSeconds}s)`,
      );
      return;
    }
    if (event.phase === 'content') {
      logInfo(
        `    [llm] model started emitting answer text (${event.contentChars ?? 0} chars, ${elapsedSeconds}s)`,
      );
      return;
    }
    if (event.phase === 'heartbeat') {
      logInfo(
        `    [llm] still streaming... reasoning=${event.reasoningChars ?? 0} chars, content=${event.contentChars ?? 0} chars, ${elapsedSeconds}s`,
      );
      return;
    }
    if (event.phase === 'complete') {
      logInfo(
        `    [llm] stream complete (${event.finishReason ?? 'unknown'}, content=${event.contentChars ?? 0} chars, ${elapsedSeconds}s)`,
      );
    }
  };
}

// ─── Commit flag parser ───────────────────────────────────────────────────────

export function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}
