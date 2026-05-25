import { type ConfluxDevkitClient, createConfluxDevkitClient } from '@cfxdevkit/client';

export const DEFAULT_BASE_URL = 'http://127.0.0.1:52000';

let controlPlaneClient: ConfluxDevkitClient | null = null;

export function getControlPlaneClient(): ConfluxDevkitClient {
  if (!controlPlaneClient) {
    controlPlaneClient = createClient();
  }
  return controlPlaneClient;
}

export async function stopControlPlaneNode(): Promise<void> {
  if (!controlPlaneClient) return;
  await controlPlaneClient.node.stop().catch(() => null);
}

export async function assertControlPlaneReachable(): Promise<void> {
  const baseUrl = resolveBaseUrl();
  const client = createConfluxDevkitClient({ baseUrl });
  try {
    await client.health();
  } catch {
    const msg =
      `devnode-server not reachable at ${baseUrl}.\n` +
      `Start it with: cdk devnode start\n` +
      `Or set CFXDEVKIT_DEVNODE_SERVER_URL to point to a running instance.\n`;
    process.stderr.write(msg);
    process.exit(1);
  }
}

function createClient(): ConfluxDevkitClient {
  return createConfluxDevkitClient({ baseUrl: resolveBaseUrl() });
}

function resolveBaseUrl(): string {
  return process.env.CFXDEVKIT_DEVNODE_SERVER_URL?.trim() ?? DEFAULT_BASE_URL;
}
