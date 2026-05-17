import { CodeSnippet } from '@cfxdevkit/example-showcase-ui';

interface DemoWallet {
  eSpace: `0x${string}`;
  core: string;
  signature: `0x${string}` | '';
  balances: { eSpace: string; core: string };
}

export function WalletSummary({ wallet }: { wallet: DemoWallet }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--cfx-space-3)' }}>
      <CodeSnippet code={wallet.eSpace} label="eSpace address" />
      <CodeSnippet code={wallet.core} label="Core address" />
      <CodeSnippet
        code={`eSpace: ${wallet.balances.eSpace}\nCore:   ${wallet.balances.core}`}
        label="Balance context"
      />
      {wallet.signature && <CodeSnippet code={wallet.signature} label="Message signature" />}
    </div>
  );
}
