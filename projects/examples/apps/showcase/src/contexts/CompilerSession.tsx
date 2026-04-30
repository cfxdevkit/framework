/**
 * `CompilerSessionProvider` — keeps the **last compile artifact**, **last
 * deploy result**, **history log**, **selected template**, and
 * **constructor arg values** alive across panel mount/unmount.
 *
 * Lazy-loaded panels in `panels/registry.ts` unmount when the user
 * switches tabs, which would otherwise wipe the React-local
 * `useState` of `<CompilerPanel>`. Hoisting the relevant state into
 * a context that lives in the App tree (next to `WalletProvider`) means
 * the user can jump to the Wallet / Contract tab and back without
 * re-compiling.
 *
 * **Persistence**: deploy history + selected template + constructor args
 * are saved to `localStorage` (was sessionStorage — promoted because users
 * legitimately want their testnet/mainnet deploys to survive across
 * browser sessions, mirroring the durable `<workspace>/deployments/contracts.json`
 * tracker that `@cfxdevkit/devkit-backend` writes from the VS Code extension).
 *
 * Schema follows the extension's `StoredContract` shape closely so the same
 * mental model carries over (chain, chainId, networkId, deployer,
 * constructorArgs, abi). The compiled bytecode is intentionally NOT
 * persisted — it can be MBs and the backend re-compiles cheaply on demand
 * via its inputHash cache.
 *
 * Exposes `lastDeploy` so panels (`<ContractPanel>`, `<ContractInteractionPanel>`)
 * can pre-fill or quick-pick the most recent deploy without manual
 * copy-paste, and `history` for the cross-network grouped view.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Abi } from 'viem';
import type { CompileTemplateResponse } from '../lib/api.js';

/** Coarse network bucket, matching the extension's tree-view groups. */
export type DeployNetworkId = 'local' | 'testnet' | 'mainnet' | 'custom';

export interface DeployLogEntry {
  /** Unique id for React keys. ms-since-epoch + tiny random suffix. */
  id: string;
  /** ISO timestamp. */
  ts: string;
  templateId: string;
  contractName: string;
  /** Chain name at deploy time (e.g. "espace-local"). */
  chainName: string;
  family: 'core' | 'espace';
  /** Numeric chain id (e.g. 1030 mainnet eSpace, 71 testnet Core, 2030 local eSpace). */
  chainId: number;
  /** Coarse environment bucket for the cross-network grouped view. */
  networkId: DeployNetworkId;
  /** `0x…` (eSpace) or `cfx:…` / `cfxtest:…` / `net2029:…` (Core). */
  address: string;
  hash: string;
  /** Deployer EOA (matches extension's `StoredContract.deployer`). */
  deployer?: string;
  /** Stringified constructor args (matches `StoredContract.constructorArgs`). */
  constructorArgs?: unknown[];
  /**
   * Compiled ABI — stored alongside the address so the
   * `ContractInteractionPanel` can render its read/write functions without
   * re-compiling. Cheap (a few KB) compared to bytecode (which we don't
   * persist).
   */
  abi: Abi;
}

export interface CompilerSessionState {
  /** The most recently compiled artifact (null until first compile). */
  artifact: CompileTemplateResponse | null;
  setArtifact: (a: CompileTemplateResponse | null) => void;

  /** Selected template id — survives tab switches. */
  selected: string;
  setSelected: (id: string) => void;

  /** User-typed constructor arg values. */
  argValues: Record<string, string>;
  setArgValues: (
    v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;

  /** Most recent deploy result (null until first successful deploy). */
  lastDeploy: DeployLogEntry | null;

  /** Append-only log of all successful deploys (capped at 50 entries). */
  history: DeployLogEntry[];
  pushDeploy: (entry: Omit<DeployLogEntry, 'id' | 'ts'>) => void;
  removeDeploy: (id: string) => void;
  clearHistory: () => void;
}

const Ctx = createContext<CompilerSessionState | null>(null);

// localStorage keys (was sessionStorage). The `v2` suffix on history forces
// a fresh slate when shipping the schema change so the new required fields
// (chainId/networkId) don't break older entries.
const LS_SELECTED = 'showcase.compiler.selected';
const LS_ARGS = 'showcase.compiler.args';
const LS_HISTORY = 'showcase.compiler.history.v2';

const HISTORY_CAP = 50;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode, quota); fail silently.
  }
}

export function CompilerSessionProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<CompileTemplateResponse | null>(null);
  const [selected, setSelectedRaw] = useState<string>(() => readJSON<string>(LS_SELECTED, ''));
  const [argValues, setArgValuesRaw] = useState<Record<string, string>>(() =>
    readJSON<Record<string, string>>(LS_ARGS, {}),
  );
  const [history, setHistory] = useState<DeployLogEntry[]>(() =>
    readJSON<DeployLogEntry[]>(LS_HISTORY, []),
  );

  const setSelected = useCallback((id: string) => {
    setSelectedRaw(id);
    writeJSON(LS_SELECTED, id);
  }, []);

  const setArgValues = useCallback(
    (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
      setArgValuesRaw((prev) => {
        const next = typeof v === 'function' ? v(prev) : v;
        writeJSON(LS_ARGS, next);
        return next;
      });
    },
    [],
  );

  const pushDeploy = useCallback((entry: Omit<DeployLogEntry, 'id' | 'ts'>) => {
    const full: DeployLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: new Date().toISOString(),
    };
    setHistory((prev) => {
      const next = [full, ...prev].slice(0, HISTORY_CAP);
      writeJSON(LS_HISTORY, next);
      return next;
    });
  }, []);

  const removeDeploy = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeJSON(LS_HISTORY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeJSON(LS_HISTORY, []);
  }, []);

  // The first entry of the history is always the most recent successful
  // deploy (pushDeploy unshifts).
  const lastDeploy = history[0] ?? null;

  // Mirror artifact changes nowhere — bytecode can be large, and the
  // user re-compiling is cheap (the backend caches by inputHash).
  useEffect(() => {
    // intentional no-op; here so future devs see we explicitly chose
    // not to persist the artifact.
  }, []);

  const value = useMemo<CompilerSessionState>(
    () => ({
      artifact,
      setArtifact,
      selected,
      setSelected,
      argValues,
      setArgValues,
      lastDeploy,
      history,
      pushDeploy,
      removeDeploy,
      clearHistory,
    }),
    [
      artifact,
      selected,
      setSelected,
      argValues,
      setArgValues,
      lastDeploy,
      history,
      pushDeploy,
      removeDeploy,
      clearHistory,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompilerSession(): CompilerSessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCompilerSession must be called inside <CompilerSessionProvider>');
  return v;
}
