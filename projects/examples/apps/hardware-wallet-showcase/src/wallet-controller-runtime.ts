import type { Dispatch, SetStateAction } from 'react';
import type { LedgerSession } from './ledger-session.js';
import type { LedgerState } from './wallet-state.js';

export async function runWalletAction(
  setState: Dispatch<SetStateAction<LedgerState>>,
  activity: string,
  action: () => Promise<void>,
) {
  setState((current) => ({ ...current, status: 'busy', activity, error: '', notice: '' }));
  try {
    await action();
    setState((current) => ({ ...current, activity: '' }));
  } catch (cause) {
    setState((current) => ({
      ...current,
      status: 'error',
      error: cause instanceof Error ? cause.message : String(cause),
      activity: '',
    }));
  }
}

export function requireSession(session: LedgerSession | null): LedgerSession {
  if (!session) throw new Error('Connect Ledger first');
  return session;
}
