import type { DevNode } from '@cfxdevkit/devnode';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ProjectContext } from '../context/types.js';
import { chainResources, readChainResource } from './chain.js';
import { contractResources, readContractResource } from './contracts.js';
import { docsResources, readDocsResource } from './docs.js';
import { projectResources, readProjectResource } from './project.js';

const ALL_STATIC_RESOURCES = [
  ...projectResources,
  ...chainResources,
  ...contractResources,
  ...docsResources,
];

export function registerAllResources(
  server: Server,
  context: ProjectContext,
  getNode: () => DevNode | undefined,
): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: ALL_STATIC_RESOURCES,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri.startsWith('cfxdevkit://chain/')) {
      return readChainResource(uri, getNode);
    }
    if (uri.startsWith('cfxdevkit://contracts/')) {
      return readContractResource(uri, context);
    }
    if (uri.startsWith('cfxdevkit://project/')) {
      return readProjectResource(uri, context);
    }
    if (uri.startsWith('cfxdevkit://docs/')) {
      return readDocsResource(uri);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Unknown resource: ${uri}`,
        },
      ],
    };
  });
}
