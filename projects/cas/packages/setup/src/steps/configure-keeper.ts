import { confirm, password } from '@inquirer/prompts';
import { automationManagerAbi } from '@cfxdevkit/protocol';
import { createClient, http } from '@cfxdevkit/core/client';
import { espaceLocal, espaceMainnet, espaceTestnet } from '@cfxdevkit/core/chains';
import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import { sendWrite } from '@cfxdevkit/contracts/write';
import type { Hex } from '@cfxdevkit/core';
import type { WizardState } from '../wizard.js';
import { getBalance, isKeeper } from '../chain/read.js';

function chainIdForState(network: string): number {
  if (network === 'testnet') return espaceTestnet.id;
  if (network === 'mainnet') return espaceMainnet.id;
  return espaceLocal.id;
}

export async function configureKeeper(state: WizardState): Promise<WizardState> {
  console.log('\n── Keeper Configuration ──────────────────────────────');

  const enableKeeper = await confirm({
    message: 'Enable keeper mode? (processes and executes automation jobs)',
    default: false,
  });

  if (!enableKeeper) {
    console.log('  Keeper mode disabled.');
    return { ...state, keeperEnabled: false };
  }

  // Prompt for signer private key (masked)
  const rawKey = await password({
    message: 'Signer private key (0x-prefixed, masked):',
  });
  const signerKey = rawKey.trim() as Hex;

  // Derive address from private key
  const chainId = chainIdForState(state.network);
  const signer = signerFromPrivateKey(signerKey);
  const signerAddress = signer.account.address;
  console.log(`  Signer address: ${signerAddress}`);

  // Check native CFX balance
  const balance = await getBalance(state.rpcUrl, chainId, signerAddress);
  if (balance === 0n) {
    console.warn(`  ⚠ Signer has 0 CFX — keeper will not be able to pay gas`);
    const continueAnyway = await confirm({
      message: 'Continue anyway?',
      default: false,
    });
    if (!continueAnyway) {
      console.log('  Keeper setup aborted.');
      return { ...state, keeperEnabled: false };
    }
  } else {
    const cfxBalance = Number(balance) / 1e18;
    console.log(`  ✓ Signer balance: ${cfxBalance.toFixed(4)} CFX`);
  }

  // Check if already registered
  const registered = await isKeeper(
    state.rpcUrl,
    chainId,
    state.automationManagerAddress,
    signerAddress,
  );

  if (registered) {
    console.log('  ✓ Already registered as keeper');
  } else {
    console.log('  Signer is not registered. Registration requires calling setKeeper() as the contract owner.');
    const ownerKey = await password({
      message: 'Owner private key (0x-prefixed, masked):',
    });
    const ownerPrivateKey = ownerKey.trim() as Hex;

    const baseChain =
      state.network === 'mainnet' ? espaceMainnet
      : state.network === 'testnet' ? espaceTestnet
      : espaceLocal;
    const chain = { ...baseChain, rpc: { ...baseChain.rpc, http: [state.rpcUrl] as const } };

    const client = createClient({ chain, transport: http(state.rpcUrl) });
    const ownerSigner = signerFromPrivateKey(ownerPrivateKey);

    console.log('  Calling setKeeper(signer, true)…');
    const result = await sendWrite({
      client,
      signer: ownerSigner,
      address: state.automationManagerAddress,
      abi: automationManagerAbi,
      functionName: 'setKeeper',
      args: [signerAddress as `0x${string}`, true],
      waitForReceipt: true,
    });
    console.log(`  ✓ setKeeper tx: ${result.hash}`);
  }

  return { ...state, keeperEnabled: true, signerKey };
}
