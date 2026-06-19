## 1. Analysis and Setup

- [ ] 1.1 Map current file dependencies and identify shared exports across all 38 kebab groups
- [ ] 1.2 Create consolidated module entry points and update package.json exports if necessary

## 2. Consolidate tooling-cli agent files

- [ ] 2.1 Merge agent*.ts files into agent-config.ts, agent-endpoint.ts, agent-help.ts, agent-merge.ts, agent-namespace.ts, agent-runtime.ts
- [ ] 2.2 Consolidate agent-namespace.config.test.ts and agent-namespace.runtime.test.ts into their respective runtime modules
- [ ] 2.3 Update internal imports within tooling-cli to reference consolidated modules

## 3. Consolidate arch-check check files

- [ ] 3.1 Merge check*.ts files into check-ci.ts, check-corpus.ts, check-docs.ts, check-eval.ts, check-hotspots.ts, check-report.ts, check-secrets.ts
- [ ] 3.2 Update bin entry points and internal imports in arch-check to use consolidated modules

## 4. Consolidate llm-agents api files

- [ ] 4.1 Merge api*.ts files into api-enrichment.ts, api-flags.ts, api-probe.ts
- [ ] 4.2 Consolidate api-enrichment.test.ts and api-probe.test.ts into their respective modules
- [ ] 4.3 Update worker imports and exports in llm-agents to reference consolidated modules

## 5. Consolidate pi-agent config files

- [ ] 5.1 Merge config*.ts files into config-normalize.ts, config-paths.ts, config-policy.ts, config-storage.ts, config-types.ts
- [ ] 5.2 Update pi-agent configuration loading logic to use consolidated modules

## 6. Consolidate react-ui keystore files

- [ ] 6.1 Merge use-keystore*.ts files into use-keystore-accounts.ts, use-keystore-identity.ts, use-keystore-lifecycle.ts, use-keystore-mutations.ts, use-keystore-wallets.ts
- [ ] 6.2 Update react-ui component imports to use consolidated keystore hooks

## 7. Cross-package Import Updates

- [ ] 7.1 Audit and update all cross-package imports referencing the consolidated modules
- [ ] 7.2 Verify barrel exports (index.ts) are updated or removed as appropriate to prevent circular dependencies

## 8. Validation and Testing

- [ ] 8.1 Run `pnpm run cdk -- repo check kebab-groups` to verify warning resolution
- [ ] 8.2 Execute full test suites for tooling-cli, arch-check, llm-agents, pi-agent, and react-ui
- [ ] 8.3 Perform manual smoke tests on affected CLI commands and UI features to ensure runtime behavior is unchanged
