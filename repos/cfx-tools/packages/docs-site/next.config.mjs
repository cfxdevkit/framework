import nextra from 'nextra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextra = nextra({
  defaultShowCopyCode: true,
});

// biome-ignore lint: Next.js requires default export for config
export default withNextra({
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
});
