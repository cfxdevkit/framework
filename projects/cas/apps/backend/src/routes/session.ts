import { readBearerToken, type SessionToken, verifySessionToken } from '@cfxdevkit/services/auth';
import type { Request, Response } from 'express';
import type { CasBackendState } from '../types.js';

export function isAdminAddress(address: string, state: CasBackendState): boolean {
  if (state.config.adminAddresses.length === 0) return true;
  return state.config.adminAddresses.includes(address.toLowerCase());
}

export function readSession(req: Request, state: CasBackendState): SessionToken | null {
  const token = readBearerToken(req.header('authorization'));
  if (!token) return null;
  return verifySessionToken(token, { secret: state.config.authSecret });
}

export function requireSession(
  req: Request,
  res: Response,
  state: CasBackendState,
): SessionToken | null {
  const session = readSession(req, state);
  if (!session) {
    res.status(401).json({ error: 'missing or invalid bearer token' });
    return null;
  }
  return session;
}

export function requireAdmin(
  req: Request,
  res: Response,
  state: CasBackendState,
): SessionToken | null {
  const session = requireSession(req, res, state);
  if (!session) return null;
  const isAdmin = session.claims?.isAdmin === true || isAdminAddress(session.address, state);
  if (!isAdmin) {
    res.status(403).json({ error: 'admin access required' });
    return null;
  }
  return session;
}
