export interface DevNodeAccountSnapshot {
  index: number;
  evmAddress: string;
  coreAddress: string;
  privateKey: string;
  initialBalanceCfx: string;
}

export interface DevNodeStatusSnapshot {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  running: boolean;
  urls?: { core: string; espace: string; coreWs: string; espaceWs: string };
  faucet?: DevNodeAccountSnapshot;
}

const BACKEND_BASE = import.meta.env.VITE_SHOWCASE_BACKEND_URL ?? '';

export function devNodeStatus(): Promise<DevNodeStatusSnapshot> {
  return backendRequest('/devnode/status', 'GET');
}

export function startDevNode(): Promise<DevNodeStatusSnapshot> {
  return backendRequest('/devnode/start', 'POST', { miningIntervalMs: 0 });
}

export function stopDevNode(): Promise<DevNodeStatusSnapshot> {
  return backendRequest('/devnode/stop', 'POST');
}

export function packDevNodeTxs(): Promise<DevNodeStatusSnapshot> {
  return backendRequest('/devnode/mine', 'POST', { pack: true });
}

async function backendRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const init: RequestInit = { method, signal: controller.signal };
    if (body !== undefined) {
      init.headers = { 'content-type': 'application/json' };
      init.body = JSON.stringify(body);
    }
    const response = await fetch(`${BACKEND_BASE}${path}`, init);
    const payload = (await response.json()) as T & { error?: string };
    if (!response.ok || payload.error) {
      throw new Error(payload.error ?? `${method} ${path} failed`);
    }
    return payload;
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new Error(
        'Showcase backend did not respond. Start @cfxdevkit/example-showcase-backend on port 5174.',
      );
    }
    throw cause;
  } finally {
    window.clearTimeout(timeout);
  }
}
