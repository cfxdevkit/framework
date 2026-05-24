## MODIFIED Requirements

### Requirement: Build gate SHALL run by default in the precommit quality sequence

**Status update:** `build` is now also registered in `cdk-repo-check`'s canonical `validationStepDefinitions` (not only in `llm-agents/QUALITY_GATES`). The `gates.ts` build gate now delegates to `runRepoCommand('build', [])` via the structured layer. All other requirements from the original spec are unchanged.
