import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 5174);
const origin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : true;

const app = createApp({ corsOrigin: origin });
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[showcase-backend] listening on http://127.0.0.1:${port}`);
});
