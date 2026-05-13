#!/usr/bin/env node
import { runArchCheck } from '../checks/arch.js';

const result = await runArchCheck();

if (result.findings.length) {
  console.error(`Architecture check ${result.status}: ${result.findings.length} finding(s)`);
  for (const finding of result.findings) {
    console.error(`- ${finding.file ?? '<repo>'} [${finding.rule ?? 'arch'}] ${finding.issue}`);
  }
} else {
  console.log(
    `Architecture check passed (${result.packageCount} package(s), lifecycle: ${result.lifecycle}).`,
  );
}

if (result.status === 'error') process.exitCode = 1;
