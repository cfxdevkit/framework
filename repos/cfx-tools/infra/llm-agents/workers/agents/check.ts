import { resolveExecutionContext } from '../shared/execution-context.ts';
import { execFileAsync, root } from '../shared/index.ts';
import {
  materializeOpenSpecChanges,
  readValidationArtifact,
  runRepoCheckCommand,
} from './check-artifacts.ts';
import { buildAgentCheckPlan, collectActionableValidationSteps } from './check-plan.ts';
import { renderAgentCheckConsoleSummary, renderAgentCheckReport } from './check-render.ts';
import type { AgentCheckFlags, AgentCheckFollowUp, AgentCheckPlan } from './check-types.ts';
import { repoCheckCommand, validationArtifactPath } from './check-types.ts';
import { writeJsonReport, writeMarkdownReport } from './runtime/index.ts';

export {
  normalizeAgentCheckPlan,
  renderAgentCheckConsoleSummary,
  renderAgentCheckReport,
} from './check-render.ts';
export type { AgentCheckFlags } from './check-types.ts';

export async function runAgentCheck(rawArgs: readonly string[], opts: { silent?: boolean } = {}) {
  const flags = parseAgentCheckFlags(rawArgs);
  const executionContext = await resolveExecutionContext({ useLlm: true, action: 'review' });
  const repoCheck = await runRepoCheckCommand();
  const validation = await readValidationArtifact(validationArtifactPath);
  const actionableSteps = collectActionableValidationSteps(validation);
  const plan = actionableSteps.length
    ? await buildAgentCheckPlan({ repoCheck, validation, actionableSteps, flags })
    : null;
  const artifacts =
    !plan || flags.dryRun ? [] : await materializeOpenSpecChanges(plan.changes, validation, flags);
  const followUp =
    !plan || flags.dryRun
      ? defaultAgentCheckFollowUp(
          flags,
          plan?.branch.name ?? null,
          flags.dryRun
            ? 'Skipped follow-up because this was a dry run.'
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
  for (const arg of args) {
    if (arg === '--quick') quick = true;
    if (arg === '--dry-run' || arg === '--no-write') dryRun = true;
    if (arg === '--create-branch') createBranch = true;
    if (arg === '--draft-pr') {
      draftPr = true;
      createBranch = true;
    }
  }
  return { quick, dryRun, createBranch, draftPr };
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
