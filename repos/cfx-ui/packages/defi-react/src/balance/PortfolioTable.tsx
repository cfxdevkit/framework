import type { Address } from '@cfxdevkit/core/types';
import type { PortfolioRow, TokenInfo } from '../types.js';
import { usePortfolio } from './usePortfolio.js';

export interface PortfolioTableProps {
  tokens: TokenInfo[];
  address?: Address | null;
  renderRow?: (row: PortfolioRow) => React.ReactNode;
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontFamily: 'var(--cfx-font-sans)',
  color: 'var(--cfx-color-fg-default)',
  fontSize: 'var(--cfx-text-sm)',
} as const;

const thStyle = {
  textAlign: 'left' as const,
  padding: '8px 12px',
  borderBottom: '1px solid var(--cfx-color-border-default)',
  color: 'var(--cfx-color-fg-muted)',
  fontWeight: 500,
} as const;

const tdStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--cfx-color-border-subtle)',
} as const;

const monoStyle = {
  fontFamily: 'var(--cfx-font-mono)',
} as const;

const defaultRenderRow = (row: PortfolioRow) => (
  <tr key={row.token.address}>
    <td style={tdStyle}>{row.token.symbol}</td>
    <td style={{ ...tdStyle, ...monoStyle }}>{row.formatted}</td>
    <td style={{ ...tdStyle, color: 'var(--cfx-color-fg-muted)', ...monoStyle }}>
      {row.token.address.slice(0, 6)}…{row.token.address.slice(-4)}
    </td>
  </tr>
);

/**
 * Displays a sorted list of token balances for the given address.
 * Requires `@cfxdevkit/theme/css` to be imported for CSS variables to resolve.
 */
export function PortfolioTable({ tokens, address, renderRow }: PortfolioTableProps) {
  const { rows, isLoading, error } = usePortfolio({
    tokens,
    ...(address !== undefined ? { address } : {}),
  });

  if (!address) {
    return (
      <p style={{ fontFamily: 'var(--cfx-font-sans)', color: 'var(--cfx-color-fg-muted)' }}>
        Connect a wallet to view balances.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p style={{ fontFamily: 'var(--cfx-font-sans)', color: 'var(--cfx-color-fg-muted)' }}>
        Loading balances…
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ fontFamily: 'var(--cfx-font-sans)', color: 'var(--cfx-color-feedback-danger)' }}>
        {error.message}
      </p>
    );
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Token</th>
          <th style={thStyle}>Balance</th>
          <th style={thStyle}>Address</th>
        </tr>
      </thead>
      <tbody>{rows.map((row) => (renderRow ? renderRow(row) : defaultRenderRow(row)))}</tbody>
    </table>
  );
}
