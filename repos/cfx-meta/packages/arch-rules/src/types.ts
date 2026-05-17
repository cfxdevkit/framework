export type Lifecycle = 'pre-release' | 'release';

export type RuleEnforcement = 'always' | 'on-release';

export type RuleSeverity = 'error' | 'warning';

export type RuleScope = 'all' | readonly string[];

export type VersioningPolicy = 'semver' | 'workspace' | 'internal';

export interface CrossCuttingDef {
  readonly id: 'cross-cutting';
  readonly level: -1;
  readonly crossCutting: true;
  readonly paths: readonly string[];
  readonly description: string;
  /** Must be 'dev-only'. Cross-cutting packages must never appear as runtime dependencies. */
  readonly usageConstraint: 'dev-only';
}

export interface TierDef {
  readonly id: string;
  readonly level: number;
  readonly paths: readonly string[];
  readonly description: string;
  /**
   * Tiers that are allowed to import (runtime-depend on) packages in this tier.
   * Derived from the one-way dependency rule: only higher-numbered tiers may consume lower ones.
   */
  readonly allowedFromTiers: readonly string[];
  /**
   * Versioning policy for packages in this tier.
   * - 'semver': must publish with explicit semver ranges (no workspace:*)
   * - 'workspace': may use workspace:* for intra-monorepo deps
   * - 'internal': never published; workspace-only
   */
  readonly versioningPolicy: VersioningPolicy;
}

export interface ArchRule {
  readonly id: string;
  readonly enforce: RuleEnforcement;
  readonly severity: RuleSeverity;
  readonly scope: RuleScope;
  readonly description: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface ArchRulesSchema {
  readonly version: 1;
  readonly lifecycle: Lifecycle;
  readonly 'cross-cutting': CrossCuttingDef;
  readonly tiers: readonly TierDef[];
  readonly rules: readonly ArchRule[];
}

export type ResolvedTier =
  | (Pick<TierDef, 'id' | 'level'> & { readonly crossCutting?: false })
  | { readonly id: 'cross-cutting'; readonly level: -1; readonly crossCutting: true };
