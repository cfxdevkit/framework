#!/usr/bin/env node
import { renderUnitConfigConsoleReport, runUnitConfigsCheck } from '../checks/unit-configs.js';

const report = await runUnitConfigsCheck({ json: false, write: true, failOnDrift: false });
console.log(renderUnitConfigConsoleReport(report));
