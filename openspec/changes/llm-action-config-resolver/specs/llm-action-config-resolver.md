## ADDED Requirements

### Requirement: single-action-resolver
A `resolveActionConfig(action, config)` function must exist in
`llm-agents/workers/completion/` and be exported from `llm-agents/src/index.ts`.

#### Scenario: legacy actions map only
- **WHEN** `config.actionPolicies` is empty and `config.actions['foo'] = 'ModelX'`
- **THEN** `resolveActionConfig('foo', config).model === 'ModelX'`
- **THEN** `resolveActionConfig('foo', config).baseUrl === config.baseUrl`

#### Scenario: actionPolicy with profile
- **WHEN** `config.actionPolicies['wiki-generate'] = { profile: 'github-cloud', model: 'claude-sonnet-4.6' }`
  and `config.providerProfiles['github-cloud'] = { provider: 'openai-compat', baseUrl: 'https://api.githubcopilot.com' }`
- **THEN** `resolveActionConfig('wiki-generate', config).model === 'claude-sonnet-4.6'`
- **THEN** `resolveActionConfig('wiki-generate', config).baseUrl === 'https://api.githubcopilot.com'`
- **THEN** `resolveActionConfig('wiki-generate', config).isCloud === true`
- **THEN** `resolveActionConfig('wiki-generate', config).apiKey === process.env.GITHUB_TOKEN`

### Requirement: wiki-uses-resolver
`wiki.ts` must not contain inline action-policy resolution logic.

#### Scenario: wiki.ts source
- **WHEN** `wiki.ts` is inspected
- **THEN** it calls `resolveActionConfig('wiki-generate', config)` and uses the result
- **THEN** no manual `actionPolicies?.['wiki-generate']?.profile` chain exists in the file

### Requirement: no-duplicate-resolution
`complete.ts` model selection must use `resolveActionConfig` rather than a bare
`config.actions[action]` lookup.

#### Scenario: complete with action policy
- **WHEN** an action has an `actionPolicies` entry pointing to a cloud profile
- **THEN** `complete({ action })` selects the correct model and baseUrl from the profile
