type StartFormProps = {
  isLocal: boolean;
  busy: string | null;
  mnemonic: string;
  setMnemonic: (v: string) => void;
  accounts: number;
  setAccounts: (v: number) => void;
  miningIntervalMs: number;
  setMiningIntervalMs: (v: number) => void;
  onStart: () => void;
};

export function DevNodeStartForm({
  isLocal,
  busy,
  mnemonic,
  setMnemonic,
  accounts,
  setAccounts,
  miningIntervalMs,
  setMiningIntervalMs,
  onStart,
}: StartFormProps) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>Start node</h3>
      <div className="row" style={{ marginBottom: 8 }}>
        <label style={{ flex: 1 }}>
          Mnemonic
          <input
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            style={{ fontFamily: 'var(--mono)', fontSize: 11 }}
            placeholder="BIP-39 mnemonic (blank = random)"
          />
        </label>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <label>
          Accounts
          <input
            type="number"
            value={accounts}
            min={1}
            max={20}
            style={{ width: 70 }}
            onChange={(e) => setAccounts(Number(e.target.value))}
          />
        </label>
        <label>
          Mining interval (ms)
          <input
            type="number"
            value={miningIntervalMs}
            min={0}
            step={100}
            style={{ width: 100 }}
            onChange={(e) => setMiningIntervalMs(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="primary"
          style={{ alignSelf: 'flex-end' }}
          disabled={!isLocal || !!busy}
          onClick={onStart}
        >
          {busy === 'start' ? 'Starting…' : 'Start'}
        </button>
      </div>
    </div>
  );
}

type MineSectionProps = {
  busy: string | null;
  mineBlocks: number;
  setMineBlocks: (v: number) => void;
  minePack: boolean;
  setMinePack: (v: boolean) => void;
  mining: { ticks?: number; intervalMs: number } | null | undefined;
  onMine: () => void;
};

export function DevNodeMineSection({
  busy,
  mineBlocks,
  setMineBlocks,
  minePack,
  setMinePack,
  mining,
  onMine,
}: MineSectionProps) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>Mine blocks</h3>
      <div className="row">
        <label>
          Blocks
          <input
            type="number"
            value={mineBlocks}
            min={1}
            max={100}
            style={{ width: 70 }}
            onChange={(e) => setMineBlocks(Number(e.target.value))}
          />
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={minePack}
            onChange={(e) => setMinePack(e.target.checked)}
          />
          Pack transactions
        </label>
        <button
          type="button"
          className="primary"
          style={{ alignSelf: 'flex-end' }}
          disabled={!!busy}
          onClick={onMine}
        >
          {busy === 'mine' ? 'Mining…' : 'Mine'}
        </button>
      </div>
      {mining && (
        <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          Mining ticks: {mining.ticks} · interval: {mining.intervalMs}ms
        </div>
      )}
    </div>
  );
}
