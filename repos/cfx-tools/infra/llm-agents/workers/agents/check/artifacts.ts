import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { completeStructuredAgent } from '../../completion/index.ts';
import { execFileAsync, root } from '../../shared/index.ts';
import { summarizeValidationForPrompt } from './plan.ts';
import type {
  AgentCheckArtifact,
  AgentCheckArtifactDraft,
  AgentCheckFlags,
  AgentCheckPlanChange,
  AgentCheckValidationReport,
  OpenSpecInstruction,
  OpenSpecInstructionArtifactId,
  OpenSpecInstructionSet,
} from './types.ts';
import { joinLines, stripMarkdownFences } from './types.ts';

export async function runRepoCheckCommand(): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  try {
    const { stdout, stderr } = await execFileAsync('pnpm', ['cdk', 'repo', 'check'], {
      cwd: root,
      maxBuffer: 1024 * 1024 * 20,
      env: { ...process.env, NO_COLOR: '1', MOON_COLOR: 'false' },
    });
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string; message?: string };
    return {
      exitCode: failure.code ?? 1,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? failure.message ?? '',
    };
  }
}

export async function readValidationArtifact(
  artifactPath: string,
): Promise<AgentCheckValidationReport> {
  const content = await readFile(join(root, artifactPath), 'utf8');
  return JSON.parse(content) as AgentCheckValidationReport;
}

export async function materializeOpenSpecChanges(
  changes: AgentCheckPlanChange[],
  validation: AgentCheckValidationReport,
  flags: AgentCheckFlags,
): Promise<AgentCheckArtifact[]> {
  const artifacts: AgentCheckArtifact[] = [];
  for (const change of changes) {
    await ensureOpenSpecChange(change.name);
    const instructions = await readOpenSpecInstructions(change.name);
    const draft = await buildOpenSpecDraft(change, validation, instructions, flags);
    const changeRoot = join(root, 'openspec', 'changes', change.name);
    const proposalPath = join(changeRoot, instructions.proposal.outputPath);
    const designPath = join(changeRoot, instructions.design.outputPath);
    const tasksPath = join(changeRoot, instructions.tasks.outputPath);
    const specPaths = draft.specs.map((spec) => join(changeRoot, 'specs', spec.name, 'spec.md'));
    await mkdir(dirname(proposalPath), { recursive: true });
    await writeFile(proposalPath, `${joinLines(draft.proposal.split('\n'))}\n`, 'utf8');
    await writeFile(designPath, `${joinLines(draft.design.split('\n'))}\n`, 'utf8');
    for (const [index, specPath] of specPaths.entries()) {
      await mkdir(dirname(specPath), { recursive: true });
      await writeFile(
        specPath,
        `${joinLines(draft.specs[index]?.content.split('\n') ?? [])}\n`,
        'utf8',
      );
    }
    await writeFile(tasksPath, `${joinLines(draft.tasks.split('\n'))}\n`, 'utf8');
    artifacts.push({
      name: change.name,
      proposalPath: relativeToRoot(proposalPath),
      designPath: relativeToRoot(designPath),
      specPaths: specPaths.map(relativeToRoot),
      tasksPath: relativeToRoot(tasksPath),
    });
  }
  return artifacts;
}

async function readOpenSpecInstructions(changeName: string): Promise<OpenSpecInstructionSet> {
  const ids: OpenSpecInstructionArtifactId[] = ['proposal', 'design', 'specs', 'tasks'];
  const entries = await Promise.all(
    ids.map(async (artifactId) => {
      const { stdout } = await execFileAsync(
        'openspec',
        ['instructions', artifactId, '--change', changeName, '--json'],
        { cwd: root, maxBuffer: 1024 * 1024 * 10, env: { ...process.env, NO_COLOR: '1' } },
      );
      return [artifactId, JSON.parse(stdout) as OpenSpecInstruction] as const;
    }),
  );
  return Object.fromEntries(entries) as OpenSpecInstructionSet;
}

async function buildOpenSpecDraft(
  change: AgentCheckPlanChange,
  validation: AgentCheckValidationReport,
  instructions: OpenSpecInstructionSet,
  flags: AgentCheckFlags,
): Promise<AgentCheckArtifactDraft> {
  const capabilityName = change.name;
  const changeContext = [
    `Change name: ${change.name}`,
    `Capability name: ${capabilityName}`,
    `Change title: ${change.title}`,
    `Rationale: ${change.rationale}`,
    '',
    'Issues to cover:',
    ...change.issues.map((issue) => `- ${issue}`),
    '',
    'Validation context:',
    summarizeValidationForPrompt({
      ...validation,
      report: {
        steps: validation.report.steps.filter((step) =>
          change.issues.some((issue) => step.summary.includes(issue) || issue.includes(step.id)),
        ),
      },
    }),
  ].join('\n');

  const [proposal, design, spec, tasks] = await Promise.all([
    generateOpenSpecArtifactMarkdown({
      artifactId: 'proposal',
      changeContext,
      flags,
      instruction: instructions.proposal,
      extraGuidance: [
        `Use exactly one new capability bullet named \`${capabilityName}\` in the Capabilities section.`,
        'Leave Modified Capabilities empty or set it to None when no requirement change maps to an existing spec.',
      ],
    }),
    generateOpenSpecArtifactMarkdown({
      artifactId: 'design',
      changeContext,
      flags,
      instruction: instructions.design,
      extraGuidance: [
        'Keep the design focused on implementation approach, trade-offs, and migration path for this remediation change.',
      ],
    }),
    generateOpenSpecArtifactMarkdown({
      artifactId: 'specs',
      changeContext,
      flags,
      instruction: instructions.specs,
      extraGuidance: [
        `Generate a single spec file for capability \`${capabilityName}\` at specs/${capabilityName}/spec.md.`,
        'Use ADDED Requirements unless an existing requirement truly needs modification.',
      ],
    }),
    generateOpenSpecArtifactMarkdown({
      artifactId: 'tasks',
      changeContext,
      flags,
      instruction: instructions.tasks,
      extraGuidance: [
        'Follow the checkbox numbering format exactly and include validation steps in dependency order.',
      ],
    }),
  ]);

  return { proposal, design, specs: [{ name: capabilityName, content: spec }], tasks };
}

async function generateOpenSpecArtifactMarkdown(params: {
  artifactId: OpenSpecInstructionArtifactId;
  changeContext: string;
  flags: AgentCheckFlags;
  instruction: OpenSpecInstruction;
  extraGuidance: string[];
}): Promise<string> {
  const systemPrompt = [
    `You are writing the OpenSpec ${params.artifactId} artifact for one remediation change.`,
    'Return markdown only. Do not return JSON. Do not wrap the response in fences.',
    'Follow the provided OpenSpec instruction and template exactly.',
    'Do not include explanation before or after the artifact body.',
  ].join(' ');
  const userPrompt = [
    params.changeContext,
    '',
    `Artifact: ${params.artifactId}`,
    '',
    'Instruction:',
    params.instruction.instruction,
    '',
    'Template:',
    params.instruction.template,
    '',
    'Additional guidance:',
    ...params.extraGuidance.map((line) => `- ${line}`),
    '',
    'Write the artifact markdown now.',
  ].join('\n');

  const response = await completeStructuredAgent({
    action: 'agent-check',
    flags: { noThinking: false, model: undefined },
    systemPrompt,
    userPrompt,
    maxTokens: params.flags.quick ? 2200 : 4200,
  });

  const content = stripMarkdownFences(response.content);
  if (content.trim()) return content.trim();

  const retry = await completeStructuredAgent({
    action: 'agent-check',
    flags: { noThinking: false, model: undefined },
    systemPrompt: `${systemPrompt} The previous response was invalid. Return only the artifact markdown body.`,
    userPrompt: [
      'Previous invalid response excerpt:',
      response.content.slice(0, 1200),
      '',
      userPrompt.slice(0, params.flags.quick ? 8000 : 16000),
    ].join('\n'),
    maxTokens: params.flags.quick ? 2200 : 4200,
  });
  return stripMarkdownFences(retry.content).trim();
}

async function ensureOpenSpecChange(name: string): Promise<void> {
  const changeRoot = join(root, 'openspec', 'changes', name);
  try {
    await readFile(join(changeRoot, '.openspec.yaml'), 'utf8');
    return;
  } catch {}
  await execFileAsync('openspec', ['new', 'change', name], {
    cwd: root,
    maxBuffer: 1024 * 1024 * 10,
    env: { ...process.env, NO_COLOR: '1' },
  });
}

function relativeToRoot(filePath: string): string {
  return filePath
    .slice(root.length + 1)
    .split('\\')
    .join('/');
}
