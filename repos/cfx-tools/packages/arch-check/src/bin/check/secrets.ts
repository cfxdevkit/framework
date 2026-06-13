#!/usr/bin/env node
import { runSecretsCheck } from '../../checks/secrets.js';

const result = await runSecretsCheck();

if (result.findings.length) {
  console.error('Secret leak scan failed:');
  for (const finding of result.findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
    if (finding.text) console.error(`  ${finding.text.trim()}`);
  }
  process.exitCode = 1;
} else {
  console.log('Secret leak scan passed.');
}
