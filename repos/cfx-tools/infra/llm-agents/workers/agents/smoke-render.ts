import type { ValidationProbeResult } from '../validate-models-probe.ts';
import { validateJsonProbe } from '../validate-models-report.ts';
import type { SmokeModelResult, TierProbe } from './smoke.ts';

// Re-exported so smoke.ts can import from one place
export { validateJsonProbe };

export function assignTierProbe(
  tierProbes: readonly TierProbe[],
  actions: readonly string[],
): TierProbe {
  for (const probe of [...tierProbes].reverse()) {
    if (actions.some((a) => probe.representativeActions.includes(a))) return probe;
  }
  const fallback = tierProbes[1] ?? tierProbes[0];
  if (!fallback) throw new Error('TIER_PROBES must have at least one entry');
  return fallback; // default: tier 2
}

export function validateTaskKey(key: string) {
  return (content: string) => {
    const base = validateJsonProbe(content);
    if (!base.jsonValid) {
      // Strip markdown fences some models add and retry
      const stripped = content
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      if (stripped !== content.trim()) {
        try {
          JSON.parse(stripped);
          return validateTaskKey(key)(stripped);
        } catch {
          // fall through
        }
      }
      return base;
    }
    try {
      const parsed = JSON.parse(content.trim()) as Record<string, unknown>;
      const value = parsed[key];
      const ok =
        (typeof value === 'string' && value.length > 4) ||
        (Array.isArray(value) && value.length > 0);
      return { jsonValid: true, jsonShapeOk: ok };
    } catch {
      return { jsonValid: false, jsonShapeOk: false };
    }
  };
}

export function probeStatus(p: ValidationProbeResult): string {
  if (!p.ok) {
    const err = p.error ?? '';
    if (err.includes('model_not_loaded') || err.includes('No model loaded')) return '✗ not loaded';
    if (err.includes('"empty":true')) return '✗ empty';
    if (err.includes('"status":404')) return '✗ 404';
    return '✗ err';
  }
  const ms = p.completeMs ?? p.firstResponseMs;
  return ms !== null ? `✓ ${ms}ms` : '✓';
}

export function probeJsonStatus(p: ValidationProbeResult): string {
  if (!p.ok) return probeStatus(p);
  const shape = (p as ValidationProbeResult & { jsonShapeOk?: boolean }).jsonShapeOk;
  if (shape === true) return '✓ json';
  if ((p as ValidationProbeResult & { jsonValid?: boolean }).jsonValid) return '~ shape';
  return '✗ json';
}

export function renderSmokeTable(results: readonly SmokeModelResult[]): string {
  const col = (s: string, w: number) => s.slice(0, w).padEnd(w);
  const W = {
    model: 30,
    tier: 4,
    cold: 12,
    hot: 10,
    task: 11,
    noThink: 11,
    reason: 7,
    tps: 9,
    pp: 9,
  };
  const header =
    col('Model', W.model) +
    col('Tier', W.tier) +
    col('Cold', W.cold) +
    col('Hot', W.hot) +
    col('Task+Think', W.task) +
    col('Task-Think', W.noThink) +
    col('Reason', W.reason) +
    col('TPS', W.tps) +
    col('PP', W.pp) +
    'Status';
  const sep = '─'.repeat(
    W.model + W.tier + W.cold + W.hot + W.task + W.noThink + W.reason + W.tps + W.pp + 8,
  );
  const rows = results.map((r) => {
    const tier = r.tier === 'default' ? 'dflt' : String(r.tier);
    // Use the best available timing probe result (prefer hot > task-no-think > cold)
    const timingProbe = r.probes.hot.ok
      ? r.probes.hot
      : r.probes.taskNoThink.ok
        ? r.probes.taskNoThink
        : r.probes.cold;
    const tpsStr = timingProbe.tps !== null ? `${timingProbe.tps} t/s` : '—';
    const ppStr = timingProbe.pp !== null ? `${timingProbe.pp} t/s` : '—';
    return (
      col(r.model, W.model) +
      col(tier, W.tier) +
      col(probeStatus(r.probes.cold), W.cold) +
      col(probeStatus(r.probes.hot), W.hot) +
      col(probeJsonStatus(r.probes.task), W.task) +
      col(probeJsonStatus(r.probes.taskNoThink), W.noThink) +
      col(r.reasoningObserved ? 'yes' : 'no', W.reason) +
      col(tpsStr, W.tps) +
      col(ppStr, W.pp) +
      (r.ok ? '✓ ok' : `✗ ${r.error?.slice(0, 20) ?? 'fail'}`)
    );
  });
  return [header, sep, ...rows].join('\n');
}
