import type { Address, Hex, Signer } from '@cfxdevkit/core';
import type { KeystoreService } from '@cfxdevkit/keystore-server';
import type { Capability } from '@cfxdevkit/services';
import { canonicalAttestationMessage, createSessionKey } from '@cfxdevkit/wallet/session-key';
import { Hono } from 'hono';
import { verifyMessage } from 'viem';

interface CapabilityBody {
  chains?: number[];
  contracts?: string[];
  maxValuePerTx?: string;
  notAfter?: number;
  selectors?: string[];
}

interface IssueBody {
  capability?: CapabilityBody;
}

interface VerifyBody {
  capability?: CapabilityBody;
  parent?: string;
  session?: string;
  signature?: string;
}

export function createSessionKeyRoutes(keystore: KeystoreService): Hono {
  const app = new Hono();

  app.post('/issue', async (context) => {
    const body = await readBody<IssueBody>(context);
    const capability = parseCapability(body.capability);

    let parent: Signer;
    try {
      parent = await keystore.activeSigner();
    } catch (error) {
      return context.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        409,
      );
    }

    try {
      const session = await createSessionKey({ capability, parent });
      return context.json({
        attestation: session.attestation,
        capability: serializeCapability(capability),
        ok: true,
        parent: session.parent,
        session: session.address,
      });
    } catch (error) {
      return context.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  });

  app.post('/verify', async (context) => {
    const body = await readBody<VerifyBody>(context);

    if (!body.parent || !body.session || !body.signature) {
      return context.json({ ok: false, error: 'parent, session, and signature are required' }, 400);
    }

    const capability = parseCapability(body.capability);
    const message = canonicalAttestationMessage(
      body.session as Address,
      body.parent as Address,
      capability,
    );

    try {
      const valid = await verifyMessage({
        address: body.parent as Address,
        message,
        signature: body.signature as Hex,
      });
      return context.json({ message, ok: true, valid });
    } catch (error) {
      return context.json(
        { ok: false, error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  });

  return app;
}

function parseCapability(input?: CapabilityBody): Capability {
  const capability: Capability = {};

  if (Array.isArray(input?.chains) && input.chains.length > 0) {
    capability.chains = input.chains;
  }

  if (Array.isArray(input?.contracts) && input.contracts.length > 0) {
    capability.contracts = input.contracts as Address[];
  }

  if (Array.isArray(input?.selectors) && input.selectors.length > 0) {
    capability.selectors = input.selectors as Hex[];
  }

  if (input?.maxValuePerTx?.trim()) {
    capability.maxValuePerTx = BigInt(input.maxValuePerTx);
  }

  if (typeof input?.notAfter === 'number') {
    capability.notAfter = input.notAfter;
  }

  return capability;
}

function serializeCapability(capability: Capability) {
  return {
    chains: capability.chains ?? null,
    contracts: capability.contracts ?? null,
    maxValuePerTx:
      capability.maxValuePerTx !== undefined ? capability.maxValuePerTx.toString() : null,
    notAfter: capability.notAfter ?? null,
    selectors: capability.selectors ?? null,
  };
}

async function readBody<T>(context: { req: { json: () => Promise<unknown> } }): Promise<T> {
  try {
    const body = await context.req.json();
    return (body && typeof body === 'object' ? body : {}) as T;
  } catch {
    return {} as T;
  }
}
