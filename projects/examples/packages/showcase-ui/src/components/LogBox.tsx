/**
 * Reusable little log-rendering box. Newest entry on top.
 */
import type { LogEntry } from '../lib/log.js';

export function LogBox({ entries, empty }: { entries: LogEntry[]; empty?: string }) {
  if (entries.length === 0) {
    return <div className="result muted">{empty ?? '— no events yet —'}</div>;
  }
  return (
    <div className="result" style={{ maxHeight: 240, overflow: 'auto' }}>
      {entries.map((e) => (
        <div
          key={e.id}
          style={{
            color:
              e.level === 'error'
                ? 'var(--err)'
                : e.level === 'warn'
                  ? 'var(--warn)'
                  : 'var(--text)',
            padding: '2px 0',
          }}
        >
          <span style={{ opacity: 0.55 }}>{e.ts}</span> {e.msg}
        </div>
      ))}
    </div>
  );
}
