#!/usr/bin/env node
import { runCorpusCheck } from '../checks/corpus.js';

const result = await runCorpusCheck();
if (result.status === 'error') process.exitCode = 1;
