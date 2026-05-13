#!/usr/bin/env node
import { runEvalCheck } from '../checks/eval.js';

const result = await runEvalCheck();
if (result.status === 'error') process.exitCode = 1;
