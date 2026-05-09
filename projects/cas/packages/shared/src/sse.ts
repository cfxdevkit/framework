import type { CasJobDto } from './jobs.js';

export interface CasSseJobUpdateEvent {
  type: 'job_update';
  job: CasJobDto;
}

export interface CasSseSnapshotEvent {
  type: 'snapshot';
  jobs: CasJobDto[];
}

export type CasSseEvent = CasSseJobUpdateEvent | CasSseSnapshotEvent;
