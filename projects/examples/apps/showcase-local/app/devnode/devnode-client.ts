import type {
  DevnodeMineRequest,
  DevnodeProfileSelectionResponse,
  DevnodeProfileStateResponse,
  DevnodeStatusResponse,
} from '../../lib/devnode-types';
import { showcaseRuntimeClient } from '../runtime/devkit-client';

interface ErrorWithPayload extends Error {
  payload?: DevnodeStatusResponse;
}

export async function fetchDevnodeStatus(): Promise<DevnodeStatusResponse> {
  const result = await showcaseRuntimeClient.node.status();
  return result.node as DevnodeStatusResponse;
}

export async function fetchDevnodeProfiles(): Promise<DevnodeProfileStateResponse> {
  return showcaseRuntimeClient.node.profiles();
}

export async function selectDevnodeProfile(id: string): Promise<DevnodeProfileSelectionResponse> {
  return showcaseRuntimeClient.node.selectProfile(id);
}

export async function startDevnode(): Promise<DevnodeStatusResponse> {
  return runNodeMutation(() => showcaseRuntimeClient.node.start());
}

export async function restartDevnode(): Promise<DevnodeStatusResponse> {
  return runNodeMutation(() => showcaseRuntimeClient.node.restart());
}

export async function stopDevnode(): Promise<DevnodeStatusResponse> {
  return runNodeMutation(() => showcaseRuntimeClient.node.stop());
}

export async function wipeDevnode(): Promise<DevnodeStatusResponse> {
  return runNodeMutation(() => showcaseRuntimeClient.node.wipe());
}

export async function mineDevnode(input: DevnodeMineRequest): Promise<DevnodeStatusResponse> {
  return runNodeMutation(() =>
    showcaseRuntimeClient.node.mine({
      ...(input.count === undefined ? {} : { blocks: input.count }),
    }),
  );
}

export function isErrorWithPayload(error: unknown): error is ErrorWithPayload {
  return error instanceof Error && 'payload' in error;
}

async function runNodeMutation(
  request: () => Promise<{ ok: boolean; node: unknown }>,
): Promise<DevnodeStatusResponse> {
  try {
    const result = await request();
    return result.node as DevnodeStatusResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const payload = await fetchDevnodeStatus().catch(
      () =>
        ({
          error: message,
          running: false,
          status: 'error',
        }) satisfies DevnodeStatusResponse,
    );
    const nextError = new Error(message) as ErrorWithPayload;
    nextError.payload = { ...payload, error: message };
    throw nextError;
  }
}
