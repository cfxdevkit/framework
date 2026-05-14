import type { CasJobDto, CasJobStatus } from './jobs.js';

export interface CasAdminStatusResponse {
  paused: boolean;
}

export interface CasAdminJobsResponse {
  jobs: CasJobDto[];
  status?: CasJobStatus;
}

export interface CasSafetyConfigResponse {
  maxSwapUsd: number | null;
  slippageBps: number;
  maxRetries: number;
  globalPause: boolean;
}

export interface CasSafetyConfigPatchRequest {
  maxSwapUsd?: number | null;
  slippageBps?: number;
  maxRetries?: number;
}
