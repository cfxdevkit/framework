import type { BuildSystemPromptOptions, ExtensionAPI } from '@earendil-works/pi-coding-agent';

/**
 * Adds tool-specific guidance that adapts to the active tool set.
 */
function addToolGuidance(options: BuildSystemPromptOptions, basePrompt: string): string {
  const hasTool = (name: string) => options.selectedTools?.includes(name) ?? false;

  const parts: string[] = [];

  if (hasTool('read')) {
    parts.push(
      '• Use the `read` tool for file contents (supports text and images).',
      '  - For large files, use `offset` and `limit` to read in chunks.',
    );
  }

  if (hasTool('bash')) {
    parts.push(
      '• Execute commands with the `bash` tool. Use it for file operations like `ls`, `find`, `grep`.',
    );
  }

  if (hasTool('edit')) {
    parts.push(
      '• Use the `edit` tool for precise text replacements in files. Match exact content including whitespace.',
    );
  }

  if (hasTool('write')) {
    parts.push('• Use the `write` tool to create new files or overwrite existing ones completely.');
  }

  // GitNexus-specific guidance
  if (hasTool('impact') || hasTool('detect_changes')) {
    parts.push(
      '\n## GitNexus Code Intelligence\n',
      "• Run `impact({target: 'symbolName', direction: 'upstream'})` before editing any symbol.\n",
      '• Run `detect_changes()` before committing to verify expected scope.\n',
      "• Use `context({name: 'symbolName'})` for full symbol context (callers, callees, processes).\n",
      "• Use `query({query: 'concept'})` to find execution flows instead of grepping.\n",
    );
  }

  if (options.skills && options.skills.length > 0) {
    const skillNames = options.skills.map((s) => s.name).join(', ');
    parts.push(
      `\nAvailable skills: ${skillNames}`,
      'Use skill documentation for best practices on specific tools.',
    );
  }

  // DCP awareness
  if (hasTool('compress')) {
    parts.push(
      '\n## Context Pruning\n',
      '• The `compress` tool is available for reducing context size in long sessions.\n',
      '• Use it to summarize closed work streams and reduce token usage.',
    );
  }

  if (parts.length === 0) {
    return basePrompt;
  }

  return `${basePrompt}

## Tool Guidance

${parts.join('\n')}
`;
}

/**
 * Merges extension instructions with user-provided append prompts.
 */
function mergeWithUserAppend(options: BuildSystemPromptOptions): string {
  const userAppend = options.appendSystemPrompt;
  const extensionSpecific = `

## Extension-Added Context

This prompt includes tool guidance and skill information loaded dynamically.
If you have additional requirements, configure them via --append-system-prompt or project context files.

## Session State Management

Git dirty repo checks and checkpoint stashing are active for this session.
- Uncommitted changes will be stashed at turn boundaries
- Changes are restored on session shutdown
- Session state persists across turns via entry storage
`;

  if (userAppend) {
    return `${userAppend}\n\n${extensionSpecific}`;
  }

  return extensionSpecific;
}

export default function promptCustomizer(pi: ExtensionAPI): void {
  pi.on('before_agent_start', async (event) => {
    const { systemPrompt, systemPromptOptions } = event;

    const customPrompt = addToolGuidance(systemPromptOptions, systemPrompt);
    const appendSection = mergeWithUserAppend(systemPromptOptions);

    return {
      systemPrompt: `${customPrompt}${appendSection}`,
    };
  });
}
