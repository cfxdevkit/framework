// Type stub for @cfxdevkit/llm-agents — prevents tsc from following
// the real source into strict-mode violations.

export interface PrecommitResult {
  status: 'ok' | 'blocked';
}

export interface RepoAction {
  mode: string;
  title: string;
}

declare module '@cfxdevkit/llm-agents' {
  export function runPrecommitWorkflow(args: readonly string[]): Promise<PrecommitResult>;
  export function listModels(): Promise<void>;
  export function listRepoActions(): Array<[string, RepoAction]>;
  export function runReviewAgent(opts: { silent: boolean }): Promise<void>;
  export function runDocsApi(args: string[]): Promise<void>;
  export function runDocsPackagePages(args: string[]): Promise<void>;
  export function runDocsReadme(args: string[]): Promise<void>;
  export function runStructureUpkeep(args: string[]): Promise<void>;
  export const root: string;
}
