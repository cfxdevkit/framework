import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getTemplate, getTemplateFiles, listTemplates, scaffoldProject } from '@cfxdevkit/create';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleScaffoldTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_scaffold_list_templates': {
      const templates = listTemplates().map((t) => ({
        name: t.name,
        description: t.description,
      }));
      return text(JSON.stringify(templates, null, 2));
    }

    case 'cfxdevkit_scaffold_preview_template': {
      const templateName = String(args.template ?? '');
      if (!templateName) return errText('template is required.');

      const tmpl = getTemplate(templateName);
      if (!tmpl) return errText(`Template "${templateName}" not found.`);

      const files = getTemplateFiles(tmpl, 'default');
      const tree = files.map((f) => f.path);
      return text(JSON.stringify({ template: templateName, files: tree }, null, 2));
    }

    case 'cfxdevkit_scaffold_create_project': {
      const templateName = String(args.template ?? '');
      const projectName = String(args.name ?? '');
      const outputDir = String(args.outputDir ?? '');

      if (!templateName) return errText('template is required.');
      if (!projectName) return errText('name is required.');
      if (!outputDir) return errText('outputDir is required.');

      const projectDir = resolve(outputDir, projectName);

      try {
        await scaffoldProject(projectDir, templateName, {
          name: projectName,
          skipInstall: true,
        });
        return text(
          JSON.stringify(
            {
              success: true,
              projectDir,
              message: `Project "${projectName}" created from template "${templateName}".`,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errText(`Scaffold failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    case 'cfxdevkit_scaffold_add_mcp_config': {
      const projectDir = String(args.projectDir ?? '');
      const serverCommand = String(args.serverCommand ?? 'cfxdevkit-mcp');

      if (!projectDir) return errText('projectDir is required.');

      const mcpConfigPath = resolve(projectDir, '.mcp.json');
      if (existsSync(mcpConfigPath)) {
        return errText(`.mcp.json already exists at ${mcpConfigPath}. Remove it first.`);
      }

      const mcpConfig = {
        mcpServers: {
          cfxdevkit: {
            command: serverCommand,
            args: [],
          },
        },
      };

      try {
        writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf8');
        return text(
          JSON.stringify({ success: true, path: mcpConfigPath, config: mcpConfig }, null, 2),
        );
      } catch (err) {
        return errText(
          `Failed to write .mcp.json: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    default:
      return errText(`Unknown scaffold tool: ${name}`);
  }
}
