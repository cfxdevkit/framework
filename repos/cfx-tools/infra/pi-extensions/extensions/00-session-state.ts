import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';

interface SessionState {
  gitStashRef: string | null;
  dirtyFiles: string[];
  sessionStart: string;
  extensionsLoaded: string[];
}

const STATE_KEY = 'pi-extensions-session-state';

/**
 * Check for uncommitted git changes.
 * Returns { cancel: true } to block the action if changes exist.
 */
async function checkDirtyRepo(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  action: string,
): Promise<{ cancel: boolean } | undefined> {
  const { stdout, code } = await pi.exec('git', ['status', '--porcelain']);

  if (code !== 0) {
    return; // Not a git repo, allow the action
  }

  const hasChanges = stdout.trim().length > 0;
  if (!hasChanges) {
    return;
  }

  const changedFiles = stdout.trim().split('\n').filter(Boolean).length;

  if (!ctx.hasUI) {
    // In non-interactive mode, block by default
    return { cancel: true };
  }

  const choice = await ctx.ui.select(
    `You have ${changedFiles} uncommitted file(s). ${action} anyway?`,
    ['Yes, proceed anyway', 'No, let me commit first'],
  );

  if (choice !== 'Yes, proceed anyway') {
    ctx.ui.notify('Commit your changes first', 'warning');
    return { cancel: true };
  }

  return undefined;
}

/**
 * Auto-stash changes before LLM processes a turn.
 */
async function autoStash(pi: ExtensionAPI): Promise<string | null> {
  const { stdout, code } = await pi.exec('git', ['status', '--porcelain']);

  if (code !== 0 || !stdout.trim().length) {
    return null; // No changes to stash
  }

  const { code: stashCode } = await pi.exec('git', [
    'stash',
    'push',
    '-m',
    'pi-checkpoint',
    '--keep-index',
  ]);

  if (stashCode !== 0) {
    return null; // Stash failed (no changes), safe to ignore
  }

  // Get the stash ref
  const { stdout: stashList } = await pi.exec('git', ['stash', 'list', '--oneline', '-1']);
  const stashRef = stashList.trim().split(' ')[0];
  return stashRef;
}

/**
 * Restore stashed changes.
 */
async function restoreStash(pi: ExtensionAPI, stashRef: string): Promise<void> {
  if (!stashRef) return;

  // Verify the stash still exists
  const { code, stdout } = await pi.exec('git', ['stash', 'list', '--oneline']);
  if (code !== 0 || !stdout.includes(stashRef)) {
    return; // Stash no longer exists
  }

  const { code: popCode } = await pi.exec('git', ['stash', 'pop', '0']);

  if (popCode !== 0) {
    // Check if stash was already popped
    if (stdout.includes('No stash found')) {
      return;
    }
    // Handle conflicts gracefully
    const { stdout: status } = await pi.exec('git', ['status', '--porcelain']);
    if (status.trim().length > 0) {
      console.warn(
        '[pi-extensions] Checkpoint restore had conflicts. Changes are in working tree.',
      );
    }
  }
}

/**
 * Persist session state to session entries for cross-turn/cross-restart persistence.
 */
async function saveState(
  pi: ExtensionAPI,
  state: SessionState,
  ctx: ExtensionContext,
): Promise<void> {
  try {
    await pi.appendEntry({
      type: 'meta',
      text: STATE_KEY,
      details: state,
    });
  } catch {
    // Best-effort: don't break on persistence failure
  }
}

/**
 * Restore persisted state from session entries.
 */
function loadState(pi: ExtensionAPI, ctx: ExtensionContext): SessionState | null {
  const entries = ctx.sessionManager.getBranch();

  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry.type !== 'message') continue;
    const msg = entry.message;
    if (msg.role !== 'meta' || msg.content?.[0]?.text !== STATE_KEY) continue;

    const details = msg.details as SessionState | undefined;
    if (details && details.sessionStart) {
      return details;
    }
  }

  return null;
}

export default function (pi: ExtensionAPI): void {
  let state: SessionState = {
    gitStashRef: null,
    dirtyFiles: [],
    sessionStart: new Date().toISOString(),
    extensionsLoaded: ['session-state'],
  };

  // --- Session Events ---

  pi.on('session_start', async (_event, ctx) => {
    // Restore state from session entries
    const persisted = loadState(pi, ctx);
    if (persisted) {
      state = {
        ...state,
        ...persisted,
        extensionsLoaded: [...state.extensionsLoaded, ...persisted.extensionsLoaded],
      };
    }

    // Check dirty repo on session start (warn only, don't block)
    const { stdout } = await pi.exec('git', ['status', '--porcelain']);
    if (stdout.trim().length > 0 && ctx.hasUI) {
      const changedFiles = stdout.trim().split('\n').filter(Boolean).length;
      ctx.ui.notify(`⚠️ ${changedFiles} uncommitted file(s)`, 'warning');
    }
  });

  pi.on('session_before_switch', async (event, ctx) => {
    const action = event.reason === 'new' ? 'new session' : 'switch session';
    return checkDirtyRepo(pi, ctx, action);
  });

  pi.on('session_before_fork', async (_event, ctx) => {
    return checkDirtyRepo(pi, ctx, 'fork');
  });

  // --- Checkpoint Events ---

  pi.on('turn_start', async () => {
    // Auto-stash before processing the turn
    const stashRef = await autoStash(pi);
    if (stashRef) {
      state = { ...state, gitStashRef: stashRef };
    }
  });

  pi.on('session_shutdown', async (_event, ctx) => {
    // Save state to session entries
    await saveState(pi, state, ctx);

    // Restore stashed changes on shutdown
    if (state.gitStashRef) {
      await restoreStash(pi, state.gitStashRef);
    }
  });

  // --- Tool Events ---

  pi.on('tool_call', async (event, ctx) => {
    if (event.toolName === 'bash') {
      // Track dirty files for persistence
      const { stdout } = await pi.exec('git', ['status', '--porcelain']);
      if (stdout.trim().length > 0) {
        const files = stdout
          .trim()
          .split('\n')
          .map((line) => line.trim());
        state = { ...state, dirtyFiles: files };
      }
    }
  });
}
