import type { LogEntry } from '@cfxdevkit/example-showcase-ui';
import { DemoCard, LogBox } from '@cfxdevkit/example-showcase-ui';

interface LiveRpcCardProps {
  loading: boolean;
  logs: LogEntry[];
  onFetch(): void;
}

export function LiveRpcCard({ loading, logs, onFetch }: LiveRpcCardProps) {
  return (
    <DemoCard
      title="Live RPC Call"
      description="POST to /api/rpc/espace → eth_blockNumber on eSpace testnet."
    >
      <button
        type="button"
        onClick={onFetch}
        disabled={loading}
        style={{ ...buttonStyle, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Fetching…' : 'Fetch Block Number'}
      </button>
      <LogBox entries={logs} empty="Click the button to make a live RPC call." />
    </DemoCard>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-4)',
  background: 'var(--cfx-color-brand-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--cfx-radius-md)',
  fontSize: 'var(--cfx-text-sm)',
  marginBottom: 'var(--cfx-space-3)',
};
