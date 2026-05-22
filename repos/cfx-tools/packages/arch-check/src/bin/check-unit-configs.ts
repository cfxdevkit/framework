#!/usr/bin/env node
import {
  parseUnitConfigFlags,
  renderUnitConfigConsoleReport,
  runUnitConfigsCheck,
} from '../checks/unit-configs.js';

const flags = parseUnitConfigFlags(process.argv.slice(2));
const report = await runUnitConfigsCheck(flags);

if (flags.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(renderUnitConfigConsoleReport(report));
}

if (flags.failOnDrift && report.status === 'error') process.exitCode = 1;
