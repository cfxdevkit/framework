import type { CasJobDto, CasJobStatus } from './jobs.js';

export interface CasAdminStatusResponse {
  paused: boolean;
}

export interface CasAdminJobsResponse {
  jobs: CasJobDto[];
  status?: CasJobStatus;
}
