/**
 * PI TUI progress reporter — bridges onProgress/onAbort callbacks
 * to the PI ExtensionContext UI methods.
 */
export interface ProgressUiContext {
  hasUI: boolean;
  ui?: {
    setWorkingVisible: (visible: boolean) => void;
    setWorkingMessage: (message?: string) => void;
    setStatus: (key: string, value?: string) => void;
  };
}

export function createPiProgressReporter(options: {
  ctx: ProgressUiContext;
  onProgress?: (phase: string, detail?: string) => void;
  onAbort?: () => void;
}): { onProgress: (phase: string, detail?: string) => void; onAbort: () => void } {
  const { ctx, onProgress, onAbort } = options;

  const progress = (phase: string, detail?: string) => {
    const message = detail ? `${phase}: ${detail}` : phase;
    if (ctx.hasUI && ctx.ui) {
      ctx.ui.setWorkingVisible(true);
      ctx.ui.setWorkingMessage(message);
      ctx.ui.setStatus('repo-commit-progress', message);
    }
    onProgress?.(phase, detail);
  };

  const abort = () => {
    if (ctx.hasUI && ctx.ui) {
      ctx.ui.setWorkingVisible(false);
      ctx.ui.setStatus('repo-commit-progress', 'Commit workflow aborted');
    }
    onAbort?.();
  };

  return { onProgress: progress, onAbort: abort };
}
