import type { CasExecutionDto, CasJobDto } from '@cfxdevkit/cas-shared';
import { Ban, RefreshCw } from 'lucide-react';
import { IconButton } from './ui';

export function JobsTable({ jobs, executions, busy, onCancel, onExecutions }: JobsTableProps) {
  if (jobs.length === 0) return <div className="empty-state">No jobs loaded.</div>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Type</th>
          <th>Status</th>
          <th>Params</th>
          <th>Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            executions={executions[job.id] ?? []}
            onCancel={() => onCancel(job.id)}
            onExecutions={() => onExecutions(job.id)}
            busy={busy}
          />
        ))}
      </tbody>
    </table>
  );
}

export interface JobsTableProps {
  jobs: CasJobDto[];
  executions: Record<string, CasExecutionDto[]>;
  busy: boolean;
  onCancel: (id: string) => void;
  onExecutions: (id: string) => void;
}

function JobRow({ job, executions, onCancel, onExecutions, busy }: JobRowProps) {
  return (
    <tr>
      <td className="mono">{job.id}</td>
      <td>{job.type}</td>
      <td>
        <span className={`status-pill ${job.status}`}>{job.status}</span>
      </td>
      <td className="mono">{JSON.stringify(job.params)}</td>
      <td>{new Date(job.updatedAt).toLocaleString()}</td>
      <td>
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
      </td>
    </tr>
  );
}

interface JobRowProps {
  job: CasJobDto;
  executions: CasExecutionDto[];
  onCancel: () => void;
  onExecutions: () => void;
  busy: boolean;
}
