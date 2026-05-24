const DOCS_PIPELINE_REVIEW_CONTEXT = [
  'repos/cfx-tools/packages/docs-site/package.json',
  'repos/cfx-tools/packages/docs-pipeline/package.json',
  'repos/cfx-tools/packages/docs-pipeline/src/llm/package-pages.ts',
  'repos/cfx-tools/packages/docs-pipeline/src/llm/wiki.ts',
  'repos/cfx-tools/packages/docs-site/Dockerfile',
  '.github/workflows/build-docs.yml',
  '.github/workflows/deploy-docs.yml',
  'infrastructure/ansible/roles/docs/tasks/main.yml',
  'artifacts/llm/reports/docs-alignment.md',
  'artifacts/llm/reports/ci-cd.md',
] as const;

export function getDocsPipelineReviewContext(): string[] {
  return [...DOCS_PIPELINE_REVIEW_CONTEXT];
}
