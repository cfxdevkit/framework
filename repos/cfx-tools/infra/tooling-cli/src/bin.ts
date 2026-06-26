import { runCli } from './run.js';

await runCli(['repo', ...process.argv.slice(2)]);
