import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveExecutionContext } from '../shared/execution-context.js';
import { execFileAsync, root } from '../shared/index.js';
import {
  materializeOpenSpecChanges,
  readValidationArtifact,
  runRepoCheckCommand,
} from './check/artifacts';
import { buildAgentCheckPlan, collectActionableValidationSteps } from './check/plan';
import { renderAgentCheckConsoleSummary, renderAgentCheckReport } from './check/render';
import type { AgentCheckFlags, AgentCheckFollowUp, AgentCheckPlan } from './check/types';
import { repoCheckCommand, validationArtifactPath } from './check/types';
import { writeJsonReport, writeMarkdownReport } from './runtime/index.js';

const openspecChangesRoot = join(root, 'openspec', 'changes');

/** List all existing OpenSpec change names with their issue keywords (from proposal.md). */
async function listExistingOpenSpecChanges(): Promise<
  Array<{ name: string; issueKeywords: Set<string> }>
> {
  const existing: Array<{ name: string; issueKeywords: Set<string> }> = [];
  try {
    const entries = await readdir(openspecChangesRoot);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const changeDir = join(openspecChangesRoot, entry);
      const stat = await readdir(join(changeDir, 'specs')).catch(() => null);
      if (!stat) continue; // skip non-OpenSpec dirs
      const proposalPath = join(changeDir, 'proposal.md');
      const proposal = await readFile(proposalPath, 'utf8').catch(() => '');
      const keywords = new Set<string>();
      // Extract kebab-case identifiers from proposal content
      const idMatches = proposal.match(/[a-z][a-z0-9]*(-[a-z0-9]+)*/g);
      if (idMatches) {
        for (const id of idMatches) {
          const words = id.split('-');
          for (const word of words) {
            if (word.length >= 4) keywords.add(word.toLowerCase());
          }
        }
      }
      // Extract file prefixes from keystore/onekey references
      const prefixMatches = proposal.matchAll(/keystore|onekey|rename|kebab|case/gi);
      for (const m of prefixMatches) {
        keywords.add(m[0].toLowerCase());
      }
      existing.push({ name: entry, issueKeywords: keywords });
    }
  } catch {
    // openspec/changes may not exist yet
  }
  return existing;
}

/** Filter out changes whose issues are already covered by existing OpenSpec changes. */
async function filterDeduplicatedChanges(
  proposed: Array<{ name: string; title: string; rationale: string; issues: string[] }>,
  existing: Array<{ name: string; issueKeywords: Set<string> }>,
): Promise<Array<{ name: string; title: string; rationale: string; issues: string[] }>> {
  const kept: typeof proposed = [];
  for (const change of proposed) {
    const changeKeywords = new Set(
      change.issues
        .flatMap((issue) => issue.toLowerCase().split(/\s+/))
        .filter((w) => w.length >= 3),
    );
    let covered = false;
    for (const existingChange of existing) {
      if (existingChange.name === change.name) continue;
      const overlap = [...changeKeywords].filter((k) => existingChange.issueKeywords.has(k));
      // If 2+ keywords overlap significantly, this change is already covered
      if (overlap.length >= 2) {
        covered = true;
        break;
      }
    }
    if (!covered) {
      kept.push(change);
    }
  }
  return kept;
}

export {
  normalizeAgentCheckPlan,
  renderAgentCheckConsoleSummary,
  renderAgentCheckReport,
} from './check/render';
export type { AgentCheckFlags } from './check/types';

export async function runAgentCheck(rawArgs: readonly string[], opts: { silent?: boolean } = {}) {
  const flags = parseAgentCheckFlags(rawArgs);
  const executionContext = await resolveExecutionContext({ useLlm: true, action: 'review' });
  const repoCheck = await runRepoCheckCommand();
  const validation = await readValidationArtifact(validationArtifactPath);
  const actionableSteps = collectActionableValidationSteps(validation);
  const plan = actionableSteps.length
    ? await buildAgentCheckPlan({ repoCheck, validation, actionableSteps, flags })
    : null;

  // When createChanges=false, only report findings — never auto-create artifacts
  const isAdvisory = !flags.createChanges;

  const existingChanges = isAdvisory ? [] : await listExistingOpenSpecChanges();
  const deduplicatedChanges = isAdvisory
    ? []
    : plan
      ? await filterDeduplicatedChanges(plan.changes, existingChanges)
      : [];

  const artifacts =
    isAdvisory || !plan || flags.dryRun || deduplicatedChanges.length === 0
      ? []
      : await materializeOpenSpecChanges(deduplicatedChanges, validation, flags);

  const followUp =
    isAdvisory || !plan || flags.dryRun || deduplicatedChanges.length === 0
      ? defaultAgentCheckFollowUp(
          flags,
          plan?.branch.name ?? null,
          isAdvisory
            ? 'Advisory mode — review findings below. Run again with createChanges=true to auto-generate OpenSpec change artifacts.'
            : flags.dryRun
              ? 'Skipped follow-up because this was a dry run.'
              : deduplicatedChanges.length === 0 && plan
                ? 'All proposed changes are already covered by existing OpenSpec changes — no new change needed.'
                : 'No actionable findings.',
        )
      : await maybeCreateBranchAndDraftPr(plan.branch, flags);

  const report = {
    generatedAt: new Date().toISOString(),
    agent: 'check',
    status: plan ? (validation.status === 'error' ? 'planned' : 'warning-planned') : 'ok',
    executionContext,
    command: {
      command: ['pnpm', ...repoCheckCommand].join(' '),
      exitCode: repoCheck.exitCode,
      artifactPath: validationArtifactPath,
    },
    validation: { status: validation.status, summary: validation.summary, actionableSteps },
    plan: plan
      ? {
          summary: plan.summary,
          changes: plan.changes.map(({ name, title, rationale, issues }) => ({
            name,
            title,
            rationale,
            issues,
          })),
          branch: plan.branch,
          handoff: plan.handoff,
        }
      : null,
    artifacts,
    followUp,
    dryRun: flags.dryRun,
  };

  await writeJsonReport('reports/agent-check.json', report);
  await writeMarkdownReport('reports/agent-check.md', renderAgentCheckReport(report));
  if (!opts.silent) console.log(renderAgentCheckConsoleSummary(report));
  return report;
}

export function parseAgentCheckFlags(rawArgs: readonly string[]): AgentCheckFlags {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  let quick = false;
  let dryRun = false;
  let createBranch = false;
  let draftPr = false;
  let createChanges = true; // default: auto-create changes (backward compatible)
  for (const arg of args) {
    if (arg === '--quick') quick = true;
    if (arg === '--dry-run' || arg === '--no-write') dryRun = true;
    if (arg === '--create-branch') createBranch = true;
    if (arg === '--draft-pr') {
      draftPr = true;
      createBranch = true;
    }
    if (arg === '--no-create') createChanges = false;
  }
  return { quick, dryRun, createBranch, draftPr, createChanges };
}

function defaultAgentCheckFollowUp(
  flags: AgentCheckFlags,
  branchName: string | null,
  message?: string,
): AgentCheckFollowUp {
  return {
    branch: {
      requested: flags.createBranch,
      name: branchName,
      status: 'skipped',
      ...(message ? { message } : {}),
    },
    draftPr: {
      requested: flags.draftPr,
      status: 'skipped',
      ...(message ? { message } : {}),
    },
  };
}

async function maybeCreateBranchAndDraftPr(
  branch: AgentCheckPlan['branch'],
  flags: AgentCheckFlags,
): Promise<AgentCheckFollowUp> {
  const followUp = defaultAgentCheckFollowUp(flags, branch.name);
  if (!flags.createBranch) return followUp;

  try {
    const { stdout } = await execFileAsync('git', ['branch', '--show-current'], {
      cwd: root,
      maxBuffer: 1024 * 1024,
    });
    const currentBranch = stdout.trim();
    if (currentBranch === branch.name) {
      followUp.branch.status = 'active';
      followUp.branch.message = 'Already on the target branch.';
    } else {
      const branchExists = await doesLocalBranchExist(branch.name);
      if (branchExists) {
        await execFileAsync('git', ['switch', branch.name], { cwd: root, maxBuffer: 1024 * 1024 });
        followUp.branch.status = 'switched';
      } else {
        await execFileAsync('git', ['switch', '-c', branch.name], {
          cwd: root,
          maxBuffer: 1024 * 1024,
        });
        followUp.branch.status = 'created';
      }
    }
  } catch (error) {
    followUp.branch.status = 'error';
    followUp.branch.message =
      (error as { stderr?: string; message?: string })?.stderr ??
      (error as { message?: string })?.message ??
      'Failed to create or switch branch.';
    return followUp;
  }

  if (!flags.draftPr) return followUp;

  try {
    const { stdout } = await execFileAsync(
      'gh',
      [
        'pr',
        'create',
        '--draft',
        '--title',
        branch.title,
        '--body',
        branch.bodyLines.join('\n'),
        '--head',
        branch.name,
      ],
      { cwd: root, maxBuffer: 1024 * 1024 * 10, env: { ...process.env, NO_COLOR: '1' } },
    );
    followUp.draftPr.status = 'created';
    const url = stdout.split(/\s+/).find((token) => token.startsWith('https://'));
    if (url) followUp.draftPr.url = url;
  } catch (error) {
    followUp.draftPr.status = 'error';
    followUp.draftPr.message =
      (error as { stderr?: string; message?: string })?.stderr ??
      (error as { message?: string })?.message ??
      'Failed to create draft PR.';
  }

  return followUp;
}

async function doesLocalBranchExist(name: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${name}`], {
      cwd: root,
      maxBuffer: 1024 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}
