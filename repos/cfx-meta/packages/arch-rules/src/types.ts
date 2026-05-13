export type Lifecycle = 'pre-release' | 'release';

export type RuleEnforcement = 'always' | 'on-release';

export type RuleSeverity = 'error' | 'warning';

export type RuleScope = 'all' | readonly string[];

export interface CrossCuttingDef {
  readonly id: 'cross-cutting';
  readonly level: -1;
  readonly crossCutting: true;
  readonly paths: readonly string[];
  readonly description: string;
}

export interface TierDef {
  readonly id: string;
  readonly level: number;
  readonly paths: readonly string[];
  readonly description: string;
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
