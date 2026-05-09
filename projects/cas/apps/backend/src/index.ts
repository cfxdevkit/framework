import { createCasBackendApp } from './app.js';
import { resolveCasBackendConfig } from './config.js';

const config = resolveCasBackendConfig();
const { app } = createCasBackendApp({ config });

app.listen(config.port, config.host, () => {
  console.log(`CAS backend listening on http://127.0.0.1:${config.port}`);
});
