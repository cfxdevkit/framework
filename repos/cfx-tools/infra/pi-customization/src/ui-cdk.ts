import type {
  ContractsExtractReport,
  DeriveReport,
  GenerateReport,
  StatusReport,
} from './tools/cdk.js';
import type { PiOperatorUiState } from './ui.js';

export function createCdkStatusUiState(reports: StatusReport[]): PiOperatorUiState {
  const ok = reports.filter((r) => r.ok).length;
  const total = reports.length;
  const label = total === 0 ? 'no chains' : `${ok}/${total} ok`;

  return {
    statusText: `cdk status · ${label}`,
    widgetKey: 'cdk-status',
    widgetLines: [
      'CDK status',
      ...reports.map((r) => {
        const tag = r.ok ? '✓' : '✗';
        const head = r.head ? ` head=${r.head}` : '';
        const lat = r.latencyMs !== undefined ? ` ${r.latencyMs}ms` : '';
        const err = r.error ? ` — ${r.error}` : '';
        return `${tag} ${r.chain.padEnd(18)} id=${String(r.chainId).padStart(5)}${head}${lat}${err}`;
      }),
    ],
  };
}

export function createCdkDeriveUiState(
  report: DeriveReport,
  options: { showPrivateKeys?: boolean; showMnemonic?: boolean } = {},
): PiOperatorUiState {
  const lines: string[] = ['CDK derive'];

  if (options.showMnemonic) {
    lines.push(`mnemonic: ${report.mnemonic}`);
  }
  lines.push(`accountType: ${report.accountType}   networkId: ${report.coreNetworkId}`);

  for (const account of report.accounts) {
    lines.push(`[${account.index}]`);
    lines.push(`  evm  : ${account.evmAddress}`);
    lines.push(`  core : ${account.coreAddress}`);
    if (options.showPrivateKeys && account.privateKey) {
      lines.push(`  pk   : ${account.privateKey}`);
    }
  }

  return {
    statusText: `cdk derive · ${report.accounts.length} account(s)`,
    widgetKey: 'cdk-derive',
    widgetLines: lines,
  };
}

export function createCdkGenerateUiState(report: GenerateReport): PiOperatorUiState {
  return {
    statusText: `cdk generate · ${report.wordCount} words`,
    widgetKey: 'cdk-generate',
    widgetLines: [
      'CDK generate',
      report.mnemonic,
      `words: ${report.wordCount}   valid: ${report.valid}`,
    ],
  };
}

export function createCdkContractsUiState(report: ContractsExtractReport): PiOperatorUiState {
  return {
    statusText: `cdk contracts extract · ${report.count} artifact(s)`,
    widgetKey: 'cdk-contracts',
    widgetLines: [
      'CDK contracts extract',
      `artifacts: ${report.artifactsDir}`,
      `output:    ${report.outDir}`,
      `extracted: ${report.count} contract(s)`,
    ],
  };
}
