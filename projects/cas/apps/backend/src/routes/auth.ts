import { signSessionToken } from '@cfxdevkit/services/auth';
import { parseSiweMessage, verifySiweMessage } from '@cfxdevkit/wallet-connect/siwe';
import type { Request, Response, Router } from 'express';
import express from 'express';
import { isAddress } from 'viem';
import type { CasBackendState } from '../types.js';
import { isAdminAddress, readSession } from './session.js';

function expectedChainId(network: 'testnet' | 'mainnet'): number {
  return network === 'mainnet' ? 1030 : 71;
}

export function createAuthRouter(state: CasBackendState): Router {
  const router = express.Router();

  router.get('/nonce', (req: Request, res: Response) => {
    const address = String(req.query.address ?? '');
    if (!isAddress(address)) {
      res.status(400).json({ error: 'address must be a valid EVM address' });
      return;
    }

    res.json({ nonce: state.db.nonces.issue(address) });
  });

  router.post('/verify', async (req: Request, res: Response) => {
    const { message, signature } = req.body ?? {};
    if (typeof message !== 'string' || typeof signature !== 'string') {
      res.status(400).json({ error: 'message and signature are required strings' });
      return;
    }
    if (!signature.startsWith('0x')) {
      res.status(400).json({ error: 'signature must be a hex string' });
      return;
    }

    try {
      const parsed = parseSiweMessage(message);
      const verification = await verifySiweMessage({
        message,
        signature: signature as `0x${string}`,
        expectedChainId: expectedChainId(state.config.network),
      });
      if (!verification.ok || !verification.address) {
        res.status(401).json({ error: verification.error ?? 'siwe verify failed' });
        return;
      }
      if (verification.address.toLowerCase() !== parsed.address.toLowerCase()) {
        res.status(401).json({ error: 'verified address does not match message address' });
        return;
      }

      const nonceOk = state.db.nonces.consume(parsed.nonce, parsed.address);
      if (!nonceOk) {
        res.status(401).json({ error: 'nonce not found, used or expired' });
        return;
      }

      const token = signSessionToken(parsed.address, {
        secret: state.config.authSecret,
        ttlMs: state.config.sessionTtlMs,
        claims: { isAdmin: isAdminAddress(parsed.address, state) },
      });
      res.json({
        token,
        address: parsed.address.toLowerCase(),
        isAdmin: isAdminAddress(parsed.address, state),
      });
    } catch (error) {
      res
        .status(401)
        .json({ error: error instanceof Error ? error.message : 'verification failed' });
    }
  });

  router.get('/me', (req: Request, res: Response) => {
    const payload = readSession(req, state);
    if (!payload) {
      res.status(401).json({ error: 'invalid or expired token' });
      return;
    }

    res.json({
      ...payload,
      isAdmin: payload.claims?.isAdmin === true || isAdminAddress(payload.address, state),
    });
  });

  return router;
}
