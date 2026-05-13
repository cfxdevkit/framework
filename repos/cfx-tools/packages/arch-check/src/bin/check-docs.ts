#!/usr/bin/env node
import { runDocsCheck } from '../checks/docs.js';

const result = await runDocsCheck();
if (result.status === 'error') process.exitCode = 1;
