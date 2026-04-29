/**
 * CORS-enabled JSON-RPC proxy for the locally-spawned dev node.
 *
 * The xcfx Conflux Rust node does not implement CORS \u2014 its OPTIONS
 * preflight returns 405, which makes browsers block any cross-origin
 * `application/json` POST. We forward `/rpc/core` and `/rpc/espace` to the
 * node's RPC ports so the showcase frontend can talk to the local devnode
 * without disabling browser security.
 *
 * Only proxies when the manager reports the node as running; returns 502
 * otherwise so the caller can fall back to a direct URL on hosted networks.
 */
import express, { type Request, type Response, type Router } from 'express';
import { type DevNodeManager, devNodeManager } from './manager.js';

type Space = 'core' | 'espace';

export function rpcProxyRouter(manager: DevNodeManager = devNodeManager): Router {
  const r = express.Router();

  const handler = (space: Space) => async (req: Request, res: Response) => {
    const status = manager.status();
    if (!status.running || !status.urls) {
      res.status(502).json({ error: 'dev node is not running' });
      return;
    }
    const target = space === 'core' ? status.urls.core : status.urls.espace;
    try {
      const upstream = await fetch(target, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req.body ?? {}),
      });
      const text = await upstream.text();
      res
        .status(upstream.status)
        .type(upstream.headers.get('content-type') ?? 'application/json')
        .send(text);
    } catch (e) {
      res.status(502).json({ error: e instanceof Error ? e.message : String(e) });
    }
  };

  r.post('/core', handler('core'));
  r.post('/espace', handler('espace'));

  return r;
}
