#!/usr/bin/env node
import { runCiCheck } from '../checks/ci.js';

const result = await runCiCheck();
if (result.status === 'error') process.exitCode = 1;
