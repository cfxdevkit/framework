import type { LogEntry } from '../lib/log';
import './log-box.css';

export function LogBox({ entries, empty }: { entries: LogEntry[]; empty?: string }) {
  if (entries.length === 0) {
    return <div className="cfx-log-box cfx-log-box--empty">{empty ?? '— no events yet —'}</div>;
  }
  return (
    <div className="cfx-log-box">
      {entries.map((e) => (
        <div key={e.id} className={`cfx-log-entry cfx-log-entry--${e.level}`}>
          <span className="cfx-log-ts">{e.ts}</span>
          <span className="cfx-log-msg">{e.msg}</span>
        </div>
      ))}
    </div>
  );
}
