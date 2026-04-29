import { run } from './run.js';

const argv = process.argv.slice(2);
run(argv).then(
  (code) => {
    process.exit(code);
  },
  (err) => {
    process.stderr.write(`cfx: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  },
);
