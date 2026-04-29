/**
 * Session-key delegation routes.
 *
 * For demo purposes the *parent's private key is sent to the server*. Real
 * deployments would have the parent sign on the client and only post the
 * resulting attestation; the server's job there is to *verify* attestations
 * and persist them. We expose both flows:
 *
 * - `POST /session-key/issue`   — server-side mint (demo); returns session
 *                                  private key + attestation.
 * - `POST /session-key/verify`  — recompute the canonical attestation message
 *                                  and verify a parent signature against it.
 */
import type { Address, Hex } from '@cfxdevkit/core';
import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import type { Capability } from '@cfxdevkit/services/keystore';
import { canonicalAttestationMessage, createSessionKey } from '@cfxdevkit/wallet/session-key';
import type { Request, Response, Router } from 'express';
import express from 'express';
import { verifyMessage } from 'viem';

interface IssueBody {
  parentPrivateKey?: string;
  capability?: {
    chains?: number[];
    contracts?: string[];
    selectors?: string[];
    maxValuePerTx?: string; // bigint as decimal string
    notAfter?: number;
  };
}

interface VerifyBody {
  parent?: string;
  session?: string;
  capability?: IssueBody['capability'];
  signature?: string;
}

function parseCapability(c: IssueBody['capability']): Capability {
  if (!c || typeof c !== 'object') return {};
  const out: Capability = {};
  if (Array.isArray(c.chains) && c.chains.length > 0) out.chains = c.chains;
  if (Array.isArray(c.contracts) && c.contracts.length > 0)
    out.contracts = c.contracts as Address[];
  if (Array.isArray(c.selectors) && c.selectors.length > 0) out.selectors = c.selectors as Hex[];
  if (typeof c.maxValuePerTx === 'string' && c.maxValuePerTx.length > 0)
    out.maxValuePerTx = BigInt(c.maxValuePerTx);
  if (typeof c.notAfter === 'number') out.notAfter = c.notAfter;
  return out;
}

export function sessionKeyRouter(): Router {
  const r = express.Router();

  r.post('/issue', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as IssueBody;
    if (!body.parentPrivateKey || !/^0x[0-9a-fA-F]{64}$/.test(body.parentPrivateKey)) {
      res.status(400).json({ error: 'parentPrivateKey must be 0x + 64 hex' });
      return;
    }
    let capability: Capability;
    try {
      capability = parseCapability(body.capability);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'invalid capability' });
      return;
    }
    try {
      const parent = signerFromPrivateKey(body.parentPrivateKey as Hex);
      const session = await createSessionKey({ parent, capability });
      // Demo only: surface the session signer's pk for the client to drive.
      // Production would keep this private and only return the attestation.
      res.json({
        parent: session.parent,
        session: session.address,
        attestation: session.attestation,
        capability: serializeCapability(capability),
      });
    } catch (err) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : 'session-key creation failed' });
    }
  });

  r.post('/verify', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as VerifyBody;
    if (
      !body.parent ||
      !body.session ||
      !body.signature ||
      !/^0x[0-9a-fA-F]{40}$/.test(body.parent) ||
      !/^0x[0-9a-fA-F]{40}$/.test(body.session)
    ) {
      res.status(400).json({ error: 'parent, session and signature are required' });
      return;
    }
    let capability: Capability;
    try {
      capability = parseCapability(body.capability);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'invalid capability' });
      return;
    }
    const message = canonicalAttestationMessage(
      body.session as Address,
      body.parent as Address,
      capability,
    );
    try {
      const ok = await verifyMessage({
        address: body.parent as Address,
        message,
        signature: body.signature as Hex,
      });
      res.json({ valid: ok, message });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'verification failed' });
    }
  });

  return r;
}

function serializeCapability(c: Capability): Record<string, unknown> {
  return {
    chains: c.chains ?? null,
    contracts: c.contracts ?? null,
    selectors: c.selectors ?? null,
    maxValuePerTx: c.maxValuePerTx !== undefined ? c.maxValuePerTx.toString() : null,
    notAfter: c.notAfter ?? null,
  };
}
