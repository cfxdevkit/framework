import type { CasExecutionDto, CasJobDto } from '@cfxdevkit/cas-shared';
import { Ban, RefreshCw } from 'lucide-react';
import { IconButton } from './ui';

export function JobsTable({ jobs, executions, busy, onCancel, onExecutions }: JobsTableProps) {
  if (jobs.length === 0) return <div className="empty-state">No jobs loaded.</div>;

  return (
    <div className="job-card-list">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          executions={executions[job.id] ?? []}
          onCancel={() => onCancel(job.id)}
          onExecutions={() => onExecutions(job.id)}
          busy={busy}
        />
      ))}
    </div>
  );
}

export interface JobsTableProps {
  jobs: CasJobDto[];
  executions: Record<string, CasExecutionDto[]>;
  busy: boolean;
  onCancel: (id: string) => void;
  onExecutions: (id: string) => void;
}

function JobCard({ job, executions, onCancel, onExecutions, busy }: JobRowProps) {
  const params = job.params as Record<string, unknown>;
  const pair = `${shortToken(params.tokenIn)} -> ${shortToken(params.tokenOut)}`;
  return (
    <article className="job-card">
      <div className="job-card-main">
        <div>
          <span className="job-kind">{job.type.replace('_', ' ')}</span>
          <h3>{pair}</h3>
          <p className="mono">{job.id}</p>
        </div>
        <span className={`status-pill ${job.status}`}>{job.status}</span>
      </div>
      <div className="job-card-meta">
        <span>{primaryAmount(job)}</span>
        <span>Updated {new Date(job.updatedAt).toLocaleString()}</span>
      </div>
      <details className="job-card-details">
        <summary>Strategy parameters</summary>
        <pre className="mono">{JSON.stringify(job.params, null, 2)}</pre>
      </details>
      <div className="job-card-actions">
        <div className="inline-actions">
          <IconButton title="Load executions" onClick={onExecutions} disabled={busy}>
            <RefreshCw size={16} />
          </IconButton>
          <IconButton
            title="Cancel job"
            onClick={onCancel}
            disabled={busy || job.status === 'cancelled'}
          >
            <Ban size={16} />
          </IconButton>
        </div>
      </div>
      {executions.length > 0 ? (
        <div className="executions with-top-gap">
          {executions.map((execution) => (
            <div className="execution-row" key={execution.id}>
              <span className="mono">{execution.txHash}</span>
              <span>
                {execution.amountOut ? `amount out ${execution.amountOut}` : 'amount out n/a'}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function shortToken(value: unknown): string {
  const raw = String(value ?? 'token');
  return raw.startsWith('0x') ? `${raw.slice(0, 6)}...${raw.slice(-4)}` : raw;
}

function primaryAmount(job: CasJobDto): string {
  const params = job.params as Record<string, unknown>;
  if (job.type === 'dca') return `Amount per swap ${String(params.amountPerSwap ?? 'n/a')}`;
  return `Amount ${String(params.amountIn ?? 'n/a')}`;
}

interface JobRowProps {
  job: CasJobDto;
  executions: CasExecutionDto[];
  onCancel: () => void;
  onExecutions: () => void;
  busy: boolean;
}
