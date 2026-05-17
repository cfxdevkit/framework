import archRulesContent from '../../../arch-rules.yaml?raw';
import type {
  ArchRule,
  ArchRulesSchema,
  Lifecycle,
  ResolvedTier,
  TierDef,
  VersioningPolicy,
} from './types.js';

export type {
  ArchRule,
  ArchRulesSchema,
  CrossCuttingDef,
  Lifecycle,
  ResolvedTier,
  RuleEnforcement,
  RuleScope,
  RuleSeverity,
  TierDef,
  VersioningPolicy,
} from './types.js';

const parsedRules = parseArchRules(archRulesContent);

export const archRules: ArchRulesSchema = parsedRules;
export const tiers: readonly TierDef[] = parsedRules.tiers;
export const rules: readonly ArchRule[] = parsedRules.rules;

export function getLifecycle(): Lifecycle {
  return parsedRules.lifecycle;
}

export function getTierFor(path: string): ResolvedTier | null {
  const normalizedPath = normalizePath(path);
  if (matchesAnyPattern(normalizedPath, parsedRules['cross-cutting'].paths)) {
    return { id: 'cross-cutting', level: -1, crossCutting: true };
  }

  const tier = parsedRules.tiers.find((candidate) =>
    matchesAnyPattern(normalizedPath, candidate.paths),
  );
  return tier ? { id: tier.id, level: tier.level } : null;
}

export function getRulesFor(tierId: string): readonly ArchRule[] {
  return parsedRules.rules.filter((rule) => ruleAppliesToTier(rule, tierId));
}

/**
 * Returns true when a package in `fromTierId` is allowed to runtime-import
 * a package in `toTierId`. Cross-cutting packages must be checked separately
 * (they are only valid as devDependencies regardless of this function).
 */
export function isImportAllowed(fromTierId: string, toTierId: string): boolean {
  if (toTierId === 'cross-cutting') return false; // use dev-only check instead
  const toTier = parsedRules.tiers.find((t) => t.id === toTierId);
  return toTier?.allowedFromTiers.includes(fromTierId) ?? false;
}

/**
 * Returns the versioning policy for a given tier id.
 * Returns null if the tier is not found or is cross-cutting.
 */
export function getVersioningPolicy(tierId: string): VersioningPolicy | null {
  return parsedRules.tiers.find((t) => t.id === tierId)?.versioningPolicy ?? null;
}

function parseArchRules(content: string): ArchRulesSchema {
  const parsed = JSON.parse(content) as ArchRulesSchema;
  validateArchRules(parsed);
  return parsed;
}

function validateArchRules(schema: ArchRulesSchema): void {
  if (schema.version !== 1) throw new Error('Unsupported arch-rules schema version.');
  if (schema.lifecycle !== 'pre-release' && schema.lifecycle !== 'release') {
    throw new Error('Invalid arch-rules lifecycle.');
  }
  const cc = schema['cross-cutting'];
  if (!cc?.crossCutting || cc.level !== -1) {
    throw new Error('Invalid cross-cutting tier definition.');
  }
  if (cc.usageConstraint !== 'dev-only') {
    throw new Error('cross-cutting usageConstraint must be "dev-only".');
  }
  const validVersioning = new Set(['semver', 'workspace', 'internal']);
  const tierIds = new Set<string>();
  for (const tier of schema.tiers) {
    if (tierIds.has(tier.id)) throw new Error(`Duplicate tier id: ${tier.id}`);
    tierIds.add(tier.id);
    if (!validVersioning.has(tier.versioningPolicy)) {
      throw new Error(`Invalid versioningPolicy "${tier.versioningPolicy}" on tier "${tier.id}".`);
    }
    if (!Array.isArray(tier.allowedFromTiers)) {
      throw new Error(`Tier "${tier.id}" must declare allowedFromTiers.`);
    }
  }
  for (const tier of schema.tiers) {
    for (const ref of tier.allowedFromTiers) {
      if (!tierIds.has(ref)) {
        throw new Error(`Tier "${tier.id}" allowedFromTiers references unknown tier "${ref}".`);
      }
    }
  }
  const ruleIds = new Set<string>();
  for (const rule of schema.rules) {
    if (ruleIds.has(rule.id)) throw new Error(`Duplicate rule id: ${rule.id}`);
    ruleIds.add(rule.id);
  }
}

function ruleAppliesToTier(rule: ArchRule, tierId: string): boolean {
  return rule.scope === 'all' || rule.scope.includes(tierId);
}

function matchesAnyPattern(path: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchesPattern(path, pattern));
}

function matchesPattern(path: string, pattern: string): boolean {
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern.endsWith('/**')) {
    return path.startsWith(normalizedPattern.slice(0, -3));
  }
  if (normalizedPattern.endsWith('/*')) {
    const prefix = normalizedPattern.slice(0, -1);
    if (!path.startsWith(prefix)) return false;
    return !path.slice(prefix.length).includes('/');
  }
  return path === normalizedPattern || path.startsWith(`${normalizedPattern}/`);
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
}
