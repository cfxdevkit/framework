import type { Job } from '@cfxdevkit/automation';
import { jobToCasDto } from '@cfxdevkit/cas-shared';
import type { Request, Response } from 'express';
import { readSession } from '../routes/session.js';
import type { CasBackendState } from '../types.js';

interface SseClient {
  owner: string;
  res: Response;
}

interface SseHub {
  clients: Set<SseClient>;
  started: boolean;
  lastPollAt: number;
}

const hubs = new WeakMap<CasBackendState, SseHub>();

export function handleJobsSse(req: Request, res: Response, state: CasBackendState): void {
  const session = readSessionFromHeaderOrQuery(req, state);
  if (!session) {
    res.status(401).json({ error: 'missing or invalid bearer token' });
    return;
  }

  const hub = getHub(state);
  startPoller(state, hub);
  const owner = session.address.toLowerCase();
  const client = { owner, res };
  hub.clients.add(client);

  res.writeHead(200, {
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'content-type': 'text/event-stream',
  });

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 30_000);
  state.db.jobs
    .list({ owner })
    .then((jobs) => writeEvent(res, { type: 'snapshot', jobs: jobs.map(jobToCasDto) }))
    .catch((error) => writeEvent(res, { type: 'error', error: readError(error) }));

  req.on('close', () => {
    clearInterval(heartbeat);
    hub.clients.delete(client);
  });
}

export function publishJobUpdate(state: CasBackendState, job: Job): void {
  const hub = hubs.get(state);
  if (!hub) return;
  for (const client of hub.clients) {
    if (client.owner === job.owner.toLowerCase()) {
      writeEvent(client.res, { type: 'job_update', job: jobToCasDto(job) });
    }
  }
}

function readSessionFromHeaderOrQuery(req: Request, state: CasBackendState) {
  const token = typeof req.query.token === 'string' ? req.query.token : null;
  if (!token) return readSession(req, state);
  const originalHeader = req.headers.authorization;
  req.headers.authorization = `Bearer ${token}`;
  const session = readSession(req, state);
  if (originalHeader === undefined) delete req.headers.authorization;
  else req.headers.authorization = originalHeader;
  return session;
}

function getHub(state: CasBackendState): SseHub {
  const existing = hubs.get(state);
  if (existing) return existing;
  const hub = { clients: new Set<SseClient>(), started: false, lastPollAt: Date.now() };
  hubs.set(state, hub);
  return hub;
}

function startPoller(state: CasBackendState, hub: SseHub): void {
  if (hub.started) return;
  hub.started = true;
  setInterval(async () => {
    if (hub.clients.size === 0) {
      hub.lastPollAt = Date.now();
      return;
    }
    const since = hub.lastPollAt;
    hub.lastPollAt = Date.now();
    const jobs = await state.db.jobs.getUpdatedSince(since);
    for (const job of jobs) publishJobUpdate(state, job);
  }, 15_000).unref();
}

function writeEvent(res: Response, payload: unknown): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function readError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
