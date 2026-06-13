#!/usr/bin/env node
import { parseHotspotFlags, renderConsoleReport, runHotspotsCheck } from '../../checks/hotspots.js';

const flags = parseHotspotFlags(process.argv.slice(2));
const report = await runHotspotsCheck(flags);

if (flags.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(renderConsoleReport(report));
}

if (flags.failOnHard && report.hardViolations.length > 0) {
  process.exitCode = 1;
}
