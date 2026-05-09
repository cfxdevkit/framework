import type { ProjectContext } from '../context/types.js';

export const projectResources = [
  {
    uri: 'cfxdevkit://project/context',
    name: 'Project Context',
    description: 'Detected project metadata (name, version, monorepo, MCP config, frontend).',
    mimeType: 'application/json',
  },
];

function json(uri: string, obj: unknown) {
  return {
    contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(obj, null, 2) }],
  };
}

export function readProjectResource(uri: string, context: ProjectContext) {
  if (uri === 'cfxdevkit://project/context') {
    return json(uri, {
      cwd: context.cwd,
      isProject: context.isProject,
      projectName: context.projectName,
      projectVersion: context.projectVersion,
      isMonorepo: context.isMonorepo,
      hasFrontend: context.hasFrontend,
      hasMcpConfig: context.mcpConfig !== null,
    });
  }

  return json(uri, { error: `Unknown project resource: ${uri}` });
}
