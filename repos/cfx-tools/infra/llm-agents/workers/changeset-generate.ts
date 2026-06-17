import { generateChangesetPlan, writeChangesetFile } from './commit/changeset.ts';
import type { complete } from './completion/index.ts';
import {
  type ExecutionContextRuntimePayload,
  logExecutionContext,
  resolveExecutionContext,
  toExecutionContextRuntimePayload,
} from './shared/execution-context.ts';
import type { RepoActionName } from './shared/index.ts';
import { repoActions, root } from './shared/index.ts';

export interface RepoActionExecutionResult {
  readonly action: RepoActionName;
  readonly definition: import('./shared/index.ts').RepoActionDefinition;
  readonly executionContext: ExecutionContextRuntimePayload;
  readonly response: Awaited<ReturnType<typeof complete>>;
}

interface ChangesetResult {
  files: string[];
  kind: 'dir';
}

function buildChangesetResult(
  executionContext: ExecutionContextRuntimePayload,
  action: RepoActionName,
  content: string,
): RepoActionExecutionResult {
  return {
    action,
    definition: repoActions[action],
    executionContext,
    response: {
      generatedAt: new Date().toISOString(),
      action,
      baseUrl: '',
      model: '',
      content,
      attempts: [],
    },
  };
}

async function scanChangedFiles(): Promise<ChangesetResult[]> {
  const { execSync } = await import('node:child_process');
  const staged = execSync('git diff --name-only --cached', {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const unstaged = execSync('git diff --name-only', {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const allFiles = [...staged.split('\n'), ...unstaged.split('\n')].filter(Boolean);

  const groups: Record<string, string[]> = {};
  for (const f of allFiles) {
    const pkg = f.match(/^(repos\/cfx-[a-z]+\/packages\/[a-z0-9-]+)/);
    const key = pkg ? pkg[1] : f.startsWith('repos/') ? f.split('/').slice(0, 4).join('/') : f;
    if (groups[key] == null) groups[key] = [];
    groups[key].push(f);
  }
  return Object.entries(groups).map(([, files]) => ({ files, kind: 'dir' as const }));
}

export async function executeChangesetGenerate(
  action: RepoActionName,
  flags: { quick: boolean; model: string | null },
): Promise<RepoActionExecutionResult> {
  const executionContext = await resolveExecutionContext({
    useLlm: true,
    action,
    modelOverride: flags.model,
  });
  logExecutionContext(executionContext);
  const runtimeContext = toExecutionContextRuntimePayload(executionContext);

  const scopeArray = await scanChangedFiles();
  if (scopeArray.length === 0) {
    console.log('✅ No changes detected; nothing to generate.');
    return buildChangesetResult(
      runtimeContext,
      action,
      'No publishable package changes detected. Nothing to generate.\nRun `git add` first, then try again.',
    );
  }

  const plan = await generateChangesetPlan(scopeArray, { quick: flags.quick });

  if (!plan.releaseRelevant || plan.changedChangesets.length > 0) {
    console.log(`✅ ${plan.summary}`);
    return buildChangesetResult(runtimeContext, action, plan.summary);
  }

  const createdFiles = await writeChangesetFile(plan);
  if (createdFiles.length > 0) {
    console.log(`✅ Created changeset: ${createdFiles.join(', ')}`);
    console.log(`\nSummary:\n${plan.summary}`);
    if (plan.changesets.length > 0) {
      console.log('\nAffected packages:');
      for (const cs of plan.changesets) {
        console.log(`  • ${cs.packageName}: ${cs.bump} — ${cs.summary}`);
      }
    }
    if (plan.risks.length > 0) {
      console.log('\n⚠️  Risks:');
      for (const r of plan.risks) console.log(`   • ${r}`);
    }
    console.log('\nNext steps:');
    console.log('  1. Review the changeset file');
    console.log('  2. Commit it: git add .changeset/');
    console.log('  3. Run `npx changeset version` to bump versions');
  }

  return buildChangesetResult(runtimeContext, action, plan.summary);
}
