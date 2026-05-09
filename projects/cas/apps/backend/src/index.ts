import { createCasBackendApp } from './app.js';
import { resolveCasBackendConfig } from './config.js';
import { createCasWorker } from './worker.js';

const config = resolveCasBackendConfig();
const { app, state } = createCasBackendApp({ config });
const worker = createCasWorker(state);

worker?.start();

const server = app.listen(config.port, config.host, () => {
  console.log(`CAS backend listening on http://127.0.0.1:${config.port}`);
  if (worker?.isRunning()) console.log('CAS keeper worker started');
});

async function shutdown() {
  await worker?.stop();
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
