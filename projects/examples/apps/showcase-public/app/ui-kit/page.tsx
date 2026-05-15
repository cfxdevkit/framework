'use client';

import { CodeSnippet, DemoCard, LogBox, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { useTheme } from '@cfxdevkit/theme/react';
import { SiteLayout } from '../site-layout';
import { COLOR_TOKENS, RADIUS_TOKENS, SPACE_TOKENS } from './ui-kit-tokens';

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function UiKitPage() {
  const { theme, resolved, set } = useTheme();

  return (
    <SiteLayout>
      {/* Theme Toggle */}
      <DemoCard
        title="Theme Toggle"
        description="useTheme() — switch between light, dark, and system themes."
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--cfx-space-3)',
            flexWrap: 'wrap',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set(t)}
              style={{
                padding: 'var(--cfx-space-2) var(--cfx-space-4)',
                background:
                  theme === t ? 'var(--cfx-color-brand-primary)' : 'var(--cfx-color-bg-emphasis)',
                color: theme === t ? '#fff' : 'var(--cfx-color-fg-default)',
                border: '1px solid var(--cfx-color-border-default)',
                borderRadius: 'var(--cfx-radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--cfx-text-sm)',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <StatusBadge status="ok" label={`Active: ${theme} (resolved: ${resolved})`} />
      </DemoCard>

      {/* Component Catalog */}
      <DemoCard
        title="Component Catalog"
        description="All reusable components from @cfxdevkit/example-showcase-ui."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cfx-space-4)' }}>
          <div>
            <p
              style={{
                fontSize: 'var(--cfx-text-xs)',
                color: 'var(--cfx-color-fg-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--cfx-space-2)',
              }}
            >
              StatusBadge
            </p>
            <div style={{ display: 'flex', gap: 'var(--cfx-space-2)', flexWrap: 'wrap' }}>
              <StatusBadge status="ok" label="ok" />
              <StatusBadge status="error" label="error" />
              <StatusBadge status="pending" label="pending" />
              <StatusBadge status="info" label="info" />
            </div>
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--cfx-text-xs)',
                color: 'var(--cfx-color-fg-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--cfx-space-2)',
              }}
            >
              CodeSnippet
            </p>
            <CodeSnippet
              code={`const cfx = listChains();\nconst testnet = cfx.find(c => c.network === 'testnet');`}
              label="example snippet"
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--cfx-text-xs)',
                color: 'var(--cfx-color-fg-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--cfx-space-2)',
              }}
            >
              LogBox
            </p>
            <LogBox
              entries={[
                {
                  id: 1,
                  level: 'info',
                  msg: 'Connected to testnet RPC',
                  ts: new Date().toISOString().slice(11, 23),
                },
                {
                  id: 2,
                  level: 'warn',
                  msg: 'Chain mismatch detected',
                  ts: new Date().toISOString().slice(11, 23),
                },
                {
                  id: 3,
                  level: 'error',
                  msg: 'Transaction reverted',
                  ts: new Date().toISOString().slice(11, 23),
                },
              ]}
              empty="No logs yet."
            />
          </div>
        </div>
      </DemoCard>

      {/* Color Tokens */}
      <DemoCard
        title="Color Tokens"
        description="CSS variables from @cfxdevkit/theme — resolved at runtime via data-theme attribute."
      >
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cfx-text-sm)' }}
        >
          <thead>
            <tr>
              {['Swatch', 'Variable', 'Category'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    color: 'var(--cfx-color-fg-subtle)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--cfx-color-border-default)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COLOR_TOKENS.map(({ name, category }) => (
              <tr key={name} style={{ borderBottom: '1px solid var(--cfx-color-border-subtle)' }}>
                <td style={{ padding: 'var(--cfx-space-2) var(--cfx-space-3)' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--cfx-radius-sm)',
                      background: `var(${name})`,
                      border: '1px solid var(--cfx-color-border-default)',
                    }}
                  />
                </td>
                <td
                  style={{
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    fontFamily: 'monospace',
                  }}
                >
                  {name}
                </td>
                <td
                  style={{
                    padding: 'var(--cfx-space-2) var(--cfx-space-3)',
                    color: 'var(--cfx-color-fg-subtle)',
                  }}
                >
                  {category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DemoCard>

      {/* Spacing & Radius Tokens */}
      <DemoCard
        title="Spacing & Radius Tokens"
        description="Space and radius CSS variables from the design system."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cfx-space-4)' }}>
          <div>
            <p
              style={{
                fontSize: 'var(--cfx-text-xs)',
                color: 'var(--cfx-color-fg-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--cfx-space-3)',
              }}
            >
              Spacing
            </p>
            <div
              style={{
                display: 'flex',
                gap: 'var(--cfx-space-4)',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              {SPACE_TOKENS.map((v) => (
                <div
                  key={v}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--cfx-space-1)',
                  }}
                >
                  <div
                    style={{
                      width: `var(${v})`,
                      height: `var(${v})`,
                      background: 'var(--cfx-color-brand-primary)',
                      borderRadius: 2,
                    }}
                  />
                  <span
                    style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-muted)' }}
                  >
                    {v.replace('--cfx-space-', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--cfx-text-xs)',
                color: 'var(--cfx-color-fg-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--cfx-space-3)',
              }}
            >
              Border Radius
            </p>
            <div
              style={{
                display: 'flex',
                gap: 'var(--cfx-space-4)',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {RADIUS_TOKENS.map((v) => (
                <div
                  key={v}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--cfx-space-1)',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 32,
                      background: 'var(--cfx-color-brand-accent)',
                      borderRadius: `var(${v})`,
                    }}
                  />
                  <span
                    style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-muted)' }}
                  >
                    {v.replace('--cfx-radius-', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DemoCard>
    </SiteLayout>
  );
}
