import express, { type Request, type Response, type Router } from 'express';
import { deployBasicErc20 } from './deploy.js';
import { account, fileKeystoreManager } from './file-manager.js';
import {
  broadcastRaw,
  buildTransaction,
  fundAddress,
  getNativeBalance,
  type Space,
  type TxDraft,
} from './tx.js';

export function keystoreRouter(): Router {
  const r = express.Router();
  r.post(
    '/file/unlock',
    handle(async (req) => fileKeystoreManager.unlock(text(req, 'passphrase'))),
  );
  r.post(
    '/file/balance',
    handle(async (req) => ({
      balance: await getNativeBalance(space(req), await fileKeystoreManager.signer()),
    })),
  );
  r.post(
    '/file/sign-message',
    handle(async (req) => {
      const signer = await fileKeystoreManager.signer();
      return {
        ...account(signer),
        rawTx: await signer.signMessage(text(req, 'message')),
        notice: 'Message signed with encrypted file keystore.',
      };
    }),
  );
  r.post(
    '/file/sign-transfer',
    handle(async (req) => {
      const signer = await fileKeystoreManager.signer();
      const rawTx = await signer.signTransaction(buildTransaction(space(req), signer, draft(req)));
      return { ...account(signer), rawTx, notice: 'Transfer signed with encrypted file keystore.' };
    }),
  );
  r.post(
    '/file/broadcast',
    handle(async (req) => {
      const signer = await fileKeystoreManager.signer();
      const txHash = await broadcastRaw(space(req), text(req, 'rawTx') as `0x${string}`);
      return {
        ...account(signer),
        txHash,
        balance: await getNativeBalance(space(req), signer),
        notice: 'Signed transaction broadcast.',
      };
    }),
  );
  r.post(
    '/file/send-transfer',
    handle(async (req) => {
      const signer = await fileKeystoreManager.signer();
      const rawTx = await signer.signTransaction(buildTransaction(space(req), signer, draft(req)));
      const txHash = await broadcastRaw(space(req), rawTx);
      return {
        ...account(signer),
        rawTx,
        txHash,
        balance: await getNativeBalance(space(req), signer),
        notice: 'Transfer sent with encrypted file keystore.',
      };
    }),
  );
  r.post(
    '/file/faucet',
    handle(async (req) => {
      const signer = await fileKeystoreManager.signer();
      const txHash = await fundAddress(space(req), signer);
      return {
        ...account(signer),
        txHash,
        balance: await getNativeBalance(space(req), signer),
        notice: 'Faucet funded encrypted file account.',
      };
    }),
  );
  r.post(
    '/file/deploy',
    handle(async (req) => ({
      ...account(await fileKeystoreManager.signer()),
      ...(await deployBasicErc20(space(req), await fileKeystoreManager.signer())),
    })),
  );
  return r;
}

function handle(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request, res: Response) => {
    try {
      res.json(await fn(req));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  };
}

function space(req: Request): Space {
  const value = req.body?.mode;
  if (value !== 'core' && value !== 'espace') throw new Error('mode must be core or espace');
  return value;
}

function text(req: Request, key: string): string {
  const value = req.body?.[key];
  if (typeof value !== 'string' || value.length === 0)
    throw new Error(`${key} must be a non-empty string`);
  return value;
}

function draft(req: Request): TxDraft {
  const value = req.body?.draft;
  if (!value || typeof value !== 'object') throw new Error('draft is required');
  return value as TxDraft;
}
