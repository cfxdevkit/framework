import { describe, expect, it } from 'vitest';
import {
  __packageName,
  getMcpTool,
  listMcpTools,
  MCP_TOOL_DEFINITIONS,
  OperationLedger,
} from './index.js';

describe('@cfxdevkit/mcp-server', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/mcp-server');
  });

  it('declares the direct-package MCP tool surface', () => {
    expect(MCP_TOOL_DEFINITIONS).toHaveLength(37);
    expect(listMcpTools('blockchain-write')).toHaveLength(6);
    expect(getMcpTool('cfxdevkit_compiler_compile_solidity')).toMatchObject({
      packageHints: ['@cfxdevkit/compiler'],
      requiresConfirmation: false,
    });
  });

  it('marks write and admin tools as confirmation-gated', () => {
    const unsafeTools = MCP_TOOL_DEFINITIONS.filter((tool) => tool.mutability !== 'read');
    expect(unsafeTools.length).toBeGreaterThan(0);
    expect(unsafeTools.every((tool) => tool.requiresConfirmation)).toBe(true);
  });

  it('records operation ledger lifecycle', () => {
    let now = 1_000;
    let id = 0;
    const ledger = new OperationLedger({ clock: () => now, idFactory: () => `op-${++id}` });

    const started = ledger.startOperation('cfxdevkit_node_status', { verbose: true });
    now = 1_100;
    ledger.addOperationStep(started.id, 'checked config');
    now = 1_250;
    const finished = ledger.finishOperation(started.id, 'succeeded');

    expect(finished).toMatchObject({
      id: 'op-1',
      tool: 'cfxdevkit_node_status',
      status: 'succeeded',
      durationMs: 250,
      steps: [{ ts: 1_100, message: 'checked config' }],
    });
  });
});
