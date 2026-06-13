#!/usr/bin/env node
import {
  parseKebabGroupFlags,
  renderKebabGroupConsoleReport,
  runKebabGroupsCheck,
} from '../checks/kebab/groups.js';

const flags = parseKebabGroupFlags(process.argv.slice(2));
const report = await runKebabGroupsCheck(flags);

if (flags.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(renderKebabGroupConsoleReport(report));
}

if (flags.failOnGroups && report.groups.length > 0) {
  process.exitCode = 1;
}
