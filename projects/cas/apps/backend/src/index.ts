import { createCasBackendApp } from './app.js';
import { resolveCasBackendConfig } from './config.js';
import { createCasWorker } from './worker.js';

const config = resolveCasBackendConfig();

// 1.1 Startup config logging
console.log(
  `[startup] NETWORK=${config.network} RPC=${config.rpcUrl} ` +
    `AutomationManager=${config.automationManagerAddress} ` +
    `PriceAdapter=${config.priceAdapterAddress} ` +
    `PermitHandler=${config.permitHandlerAddress} ` +
    `SwappiRouter=${config.swappiRouterAddress ?? '(unset)'}`,
);

// 1.2 CORS origins validation
if (config.corsOrigins.length > 0) {
  const valid = config.corsOrigins.filter((o) => o.trim().length > 0);
  if (valid.length === 0) {
    console.warn(
      '[startup] WARNING: CAS_CORS_ORIGINS is set but contains no valid entries — CORS will block all browser requests',
    );
  }
} else {
  console.warn(
    '[startup] WARNING: CAS_CORS_ORIGINS is not set — all origins are allowed (development only)',
  );
}

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
