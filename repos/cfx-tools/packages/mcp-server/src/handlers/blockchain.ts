import {
  type CoreSpaceClient,
  coreSpaceLocal,
  createClient,
  type EspaceClient,
  espaceLocal,
  formatCFX,
  http,
} from '@cfxdevkit/cdk';
import { type Abi, createPublicClient, parseAbi, http as viemHttp } from 'viem';
import { getControlPlaneClient } from '../control-plane.js';

function espacePublicClient() {
  const rpcUrl = espaceLocal.rpc.http[0] ?? 'http://127.0.0.1:8545';
  return createPublicClient({
    transport: viemHttp(rpcUrl),
  });
}

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}

function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleBlockchainTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  // ── Read tools ──────────────────────────────────────────────────────────────
  if (name === 'cfxdevkit_blockchain_espace_balance') {
    const address = String(args.address ?? '');
    const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
    try {
      const wei = await client.getBalance(address as `0x${string}`);
      return text(
        JSON.stringify(
          { address, balanceCfx: formatCFX(wei), balanceWei: wei.toString() },
          null,
          2,
        ),
      );
    } catch (err) {
      return errText(`Balance fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (name === 'cfxdevkit_blockchain_core_balance') {
    const address = String(args.address ?? '');
    const client = createClient({ chain: coreSpaceLocal, transport: http() }) as CoreSpaceClient;
    try {
      const wei = await client.getBalance(address as `0x${string}`);
      return text(
        JSON.stringify(
          { address, balanceCfx: formatCFX(wei), balanceWei: wei.toString() },
          null,
          2,
        ),
      );
    } catch (err) {
      return errText(`Balance fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (name === 'cfxdevkit_blockchain_espace_block') {
    const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
    try {
      const blockNumber = await client.getBlockNumber();
      const block = await client.getBlock(args.blockNumber !== undefined ? 'latest' : 'latest');
      return text(JSON.stringify({ currentBlock: blockNumber.toString(), block }, null, 2));
    } catch (err) {
      return errText(`Block fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (name === 'cfxdevkit_blockchain_core_epoch') {
    const client = createClient({ chain: coreSpaceLocal, transport: http() }) as CoreSpaceClient;
    try {
      const status = await client.getStatus();
      return text(JSON.stringify(status, null, 2));
    } catch (err) {
      return errText(`Epoch fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (name === 'cfxdevkit_blockchain_get_receipt') {
    const txHash = String(args.txHash ?? '');
    const client = createClient({ chain: espaceLocal, transport: http() }) as EspaceClient;
    try {
      const receipt = await client.getTransactionReceipt(txHash as `0x${string}`);
      return text(JSON.stringify(receipt, null, 2));
    } catch (err) {
      return errText(`Receipt fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (name === 'cfxdevkit_blockchain_read_erc20') {
    const address = String(args.address ?? '');
    const field = String(args.field ?? 'name');
    const viemClient = espacePublicClient();
    const erc20Abi = parseAbi([
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
    ]);
    try {
      const result = await viemClient.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: field as 'name',
      });
      return text(JSON.stringify({ address, field, result: String(result) }, null, 2));
    } catch (err) {
      return errText(`ERC-20 read failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (name === 'cfxdevkit_blockchain_call_contract_espace') {
    const address = String(args.address ?? '');
    const method = String(args.method ?? '');
    const abiRaw = args.abi as unknown[];
    const fnArgs = (args.args as unknown[]) ?? [];
    try {
      const abi = abiRaw as Abi;
      const viemClient = espacePublicClient();
      const result = await viemClient.readContract({
        address: address as `0x${string}`,
        abi,
        functionName: method,
        args: fnArgs,
      });
      return text(JSON.stringify({ address, method, args: fnArgs, result }, null, 2));
    } catch (err) {
      return errText(`Contract call failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (name === 'cfxdevkit_blockchain_call_contract_core') {
    return errText('Core space contract calls require cive integration — use eSpace for now.');
  }

  // ── Write tools ─────────────────────────────────────────────────────────────
  if (
    name.startsWith('cfxdevkit_blockchain_send_') ||
    name.startsWith('cfxdevkit_blockchain_write_') ||
    name.startsWith('cfxdevkit_blockchain_deploy_') ||
    name.startsWith('cfxdevkit_blockchain_erc20_')
  ) {
    const controlPlaneClient = getControlPlaneClient();
    const status = await controlPlaneClient.node.status();
    if (!status.node.running) {
      return errText('Node is not running. Run cfxdevkit_node_start first.');
    }

    const accountIndex = Number(args.accountIndex ?? args.from ?? 0);

    if (name === 'cfxdevkit_blockchain_send_cfx_espace') {
      const to = String(args.to ?? '');
      const amountCfx = String(args.amount ?? '1');
      try {
        const funded = await controlPlaneClient.accounts.fund({
          address: to,
          amount: amountCfx,
        });
        return text(`Sent ${amountCfx} CFX to ${to}.\nTx: ${funded.txHash}`);
      } catch (err) {
        return errText(`Send failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (name === 'cfxdevkit_blockchain_write_contract') {
      const address = String(args.address ?? '');
      const method = String(args.method ?? '');
      const abiRaw = args.abi as unknown[];
      const fnArgs = (args.args as unknown[]) ?? [];
      try {
        const result = await controlPlaneClient.contracts.write({
          accountIndex,
          abi: abiRaw,
          address,
          args: fnArgs,
          functionName: method,
          space: 'espace',
          waitForReceipt: true,
        });
        return text(`Contract ${method} called.\nTx: ${result.hash}`);
      } catch (err) {
        return errText(
          `Contract write failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (name === 'cfxdevkit_blockchain_deploy_contract') {
      const bytecode = String(args.bytecode ?? '');
      const abiRaw = args.abi as unknown[];
      const ctorArgs = (args.constructorArgs as unknown[]) ?? [];
      try {
        const deployed = await controlPlaneClient.deploy.run({
          accountIndex,
          abi: abiRaw,
          args: ctorArgs,
          bytecode,
          space: 'espace',
        });
        return text(
          JSON.stringify({ txHash: deployed.hash, contractAddress: deployed.address }, null, 2),
        );
      } catch (err) {
        return errText(`Deploy failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (
      name === 'cfxdevkit_blockchain_erc20_transfer' ||
      name === 'cfxdevkit_blockchain_erc20_approve'
    ) {
      const tokenAddress = String(args.token ?? '');
      const to = String(args.to ?? args.spender ?? '');
      const amount = String(args.amount ?? '0');
      const funcName = name.endsWith('transfer') ? 'transfer' : 'approve';
      const erc20Abi = parseAbi([
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
      ]);
      try {
        const result = await controlPlaneClient.contracts.write({
          accountIndex,
          abi: erc20Abi as unknown as unknown[],
          address: tokenAddress,
          args: [to, BigInt(amount).toString()],
          functionName: funcName,
          space: 'espace',
          waitForReceipt: true,
        });
        return text(`ERC-20 ${funcName} successful.\nTx: ${result.hash}`);
      } catch (err) {
        return errText(
          `ERC-20 ${funcName} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (name === 'cfxdevkit_blockchain_send_cfx_core') {
      return errText('Core space CFX send not yet implemented in direct-package mode. Use eSpace.');
    }
  }

  return errText(`Unknown blockchain tool: ${name}`);
}
