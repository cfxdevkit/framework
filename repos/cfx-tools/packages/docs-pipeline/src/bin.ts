#!/usr/bin/env node

import { runCli } from './run.js';

await runCli(process.argv.slice(2));
