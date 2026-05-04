// @ts-nocheck

export function logStep(n, total, label) {
  console.log(`\n[${n}/${total}] ${label}`);
}

export function logInfo(msg) {
  console.log(msg);
}

// ─── Commit flag parser ───────────────────────────────────────────────────────

export function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}
