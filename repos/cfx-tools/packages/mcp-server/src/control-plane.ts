import { type ConfluxDevkitClient, createConfluxDevkitClient } from '@cfxdevkit/client';
import { createDevnodeServerApp } from '@cfxdevkit/devnode-server';

const DEFAULT_BASE_URL = 'http://cfxdevkit-mcp.local';

interface ControlPlane {
  client: ConfluxDevkitClient;
}

let controlPlane: ControlPlane | null = null;

export function getControlPlaneClient(): ConfluxDevkitClient {
  if (!controlPlane) {
    controlPlane = createControlPlane();
  }
  return controlPlane.client;
}

export async function stopControlPlaneNode(): Promise<void> {
  if (!controlPlane) return;
  await controlPlane.client.node.stop().catch(() => null);
}

function createControlPlane(): ControlPlane {
  const baseUrl = process.env.CFXDEVKIT_DEVNODE_SERVER_URL?.trim();
  if (baseUrl) {
    return { client: createConfluxDevkitClient({ baseUrl }) };
  }

  const app = createDevnodeServerApp({ keystorePath: '.cfxdevkit-mcp-keystore.json' });
  const fetchImpl: typeof fetch = async (input, init) => {
    if (input instanceof Request) {
      return app.request(input);
    }

    const url = new URL(String(input), DEFAULT_BASE_URL);
    return app.request(`${url.pathname}${url.search}`, init);
  };

  return { client: createConfluxDevkitClient({ baseUrl: DEFAULT_BASE_URL, fetch: fetchImpl }) };
}
