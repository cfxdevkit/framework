import type { Request, Response, Router } from 'express';
import express from 'express';
import { SiweMessage } from 'siwe';
import { consumeNonce, issueNonce } from './nonces.js';
import { sign, verify } from './token.js';

export function authRouter(): Router {
  const r = express.Router();

  /**
   * GET /auth/nonce?address=0x…
   * Returns a one-time nonce bound to `address`.
   */
  r.get('/nonce', (req: Request, res: Response) => {
    const address = String(req.query.address ?? '');
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      res.status(400).json({ error: 'address must be 0x + 40 hex' });
      return;
    }
    res.json({ nonce: issueNonce(address) });
  });

  /**
   * POST /auth/verify { message, signature }
   * Verifies the SIWE message signature and returns a bearer token.
   */
  r.post('/verify', async (req: Request, res: Response) => {
    const { message, signature } = req.body ?? {};
    if (typeof message !== 'string' || typeof signature !== 'string') {
      res.status(400).json({ error: 'message and signature are required strings' });
      return;
    }
    try {
      const siwe = new SiweMessage(message);
      const result = await siwe.verify({ signature });
      if (!result.success) {
        res.status(401).json({ error: 'siwe verify failed', details: result.error });
        return;
      }
      const ok = consumeNonce(siwe.nonce, siwe.address);
      if (!ok) {
        res.status(401).json({ error: 'nonce not found, used or expired' });
        return;
      }
      const token = sign(siwe.address);
      res.json({ token, address: siwe.address.toLowerCase() });
    } catch (err) {
      res.status(401).json({ error: err instanceof Error ? err.message : 'verification failed' });
    }
  });

  /**
   * GET /auth/me
   * Echoes the bearer token's address. 401 if missing/invalid/expired.
   */
  r.get('/me', (req: Request, res: Response) => {
    const auth = req.header('authorization') ?? '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m?.[1]) {
      res.status(401).json({ error: 'missing bearer token' });
      return;
    }
    const payload = verify(m[1]);
    if (!payload) {
      res.status(401).json({ error: 'invalid or expired token' });
      return;
    }
    res.json(payload);
  });

  return r;
}
