import { input, password, select } from '@inquirer/prompts';
import {
  automationManagerAbi,
  automationManagerBytecode,
  permitHandlerAbi,
  permitHandlerBytecode,
  swappiPriceAdapterAbi,
  swappiPriceAdapterBytecode,
} from '@cfxdevkit/protocol';
import { deployContract } from '@cfxdevkit/contracts/deploy';
import { createClient, http } from '@cfxdevkit/core/client';
import { espaceLocal, espaceMainnet, espaceTestnet } from '@cfxdevkit/core/chains';
import { signerFromPrivateKey } from '@cfxdevkit/core/wallet';
import type { ChainConfig } from '@cfxdevkit/core/chains';
import type { Hex } from '@cfxdevkit/core';
import type { WizardState } from '../wizard.js';

// Swappi DEX addresses (same router on both networks)
const SWAPPI_ROUTER = '0x62b0873055Bf896DD869e172119871ac24aEA305' as const;
const SWAPPI_FACTORY: Record<'testnet' | 'mainnet', string> = {
  testnet: '0x8D0D1C7C32D8a395c817b22ff3Bd6fFa2a7EbE08',
  mainnet: '0x36b83f9D614A06AbF5388f4D14cc64E5Ff96892f',
};

function chainConfigForState(state: WizardState): ChainConfig {
  const base =
    state.network === 'mainnet' ? espaceMainnet
    : state.network === 'testnet' ? espaceTestnet
    : espaceLocal;
  // Override the RPC with the user-supplied URL
  return { ...base, rpc: { ...base.rpc, http: [state.rpcUrl] as const } };
}

async function deployFresh(state: WizardState): Promise<WizardState> {
  const label = state.network === 'local' ? 'local devnode' : state.network;
  console.log(`\nDeploying personal contracts to ${label}…`);
  console.log('  You will be the contract owner and can call setKeeper() yourself.\n');

  const rawKey = await password({
    message: 'Deployer private key (0x-prefixed, masked):',
  });
  const privateKey = rawKey.trim() as Hex;

  const chain = chainConfigForState(state);
  const transport = http(state.rpcUrl);
  const client = createClient({ chain, transport });
  const signer = signerFromPrivateKey(privateKey);
  const deployerAddress = signer.account.address;

  // Resolve Swappi router/factory addresses for the target network.
  // On local devnodes Swappi is not deployed, so prompt the user.
  let swappiRouter: string;
  let swappiFactory: string;
  if (state.network === 'local') {
    console.log('  Local devnode detected — Swappi is not pre-deployed here.');
    swappiRouter = (await input({
      message: 'Swappi router address (or any mock router):',
      default: SWAPPI_ROUTER,
    })).trim();
    swappiFactory = (await input({
      message: 'Swappi factory address (or any mock factory):',
    })).trim();
  } else {
    swappiRouter = SWAPPI_ROUTER;
    swappiFactory = SWAPPI_FACTORY[state.network];
  }

  // 1. Deploy SwappiPriceAdapter first (AutomationManager depends on its address)
  console.log(`  Deploying SwappiPriceAdapter…`);
  const paResult = await deployContract({
    client,
    signer,
    abi: swappiPriceAdapterAbi,
    bytecode: swappiPriceAdapterBytecode as Hex,
    args: [swappiRouter, swappiFactory, deployerAddress],
    waitForReceipt: true,
  });
  const paAddress = paResult.address;
  if (!paAddress) throw new Error('SwappiPriceAdapter deploy returned no address');
  console.log(`  ✓ SwappiPriceAdapter: ${paAddress}`);

  // 2. Deploy AutomationManager with the price adapter address
  console.log(`  Deploying AutomationManager…`);
  const amResult = await deployContract({
    client,
    signer,
    abi: automationManagerAbi,
    bytecode: automationManagerBytecode as Hex,
    args: [paAddress, deployerAddress],
    waitForReceipt: true,
  });
  const amAddress = amResult.address;
  if (!amAddress) throw new Error('AutomationManager deploy returned no address');
  console.log(`  ✓ AutomationManager: ${amAddress}`);

  // 3. Deploy PermitHandler (no constructor args)
  console.log(`  Deploying PermitHandler…`);
  const phResult = await deployContract({
    client,
    signer,
    abi: permitHandlerAbi,
    bytecode: permitHandlerBytecode as Hex,
    waitForReceipt: true,
  });
  const phAddress = phResult.address;
  if (!phAddress) throw new Error('PermitHandler deploy returned no address');
  console.log(`  ✓ PermitHandler: ${phAddress}`);

  return {
    ...state,
    automationManagerAddress: amAddress,
    permitHandlerAddress: phAddress,
    priceAdapterAddress: paAddress,
  };
}

async function promptAddresses(state: WizardState): Promise<WizardState> {
  const amAddr = await input({ message: 'AutomationManager address:' });
  const phAddr = await input({ message: 'PermitHandler address:' });
  const paAddr = await input({ message: 'SwappiPriceAdapter address:' });
  return {
    ...state,
    automationManagerAddress: amAddr.trim(),
    permitHandlerAddress: phAddr.trim(),
    priceAdapterAddress: paAddr.trim(),
  };
}

export async function contractMode(state: WizardState): Promise<WizardState> {
  console.log('\n── Contract Mode ─────────────────────────────────────');

  const networkLabel = state.network === 'local' ? 'local devnode' : state.network;

  const mode = await select<'deploy' | 'manual'>({
    message: `Contract mode for ${networkLabel}:`,
    choices: [
      { name: 'Deploy my own contracts (you become the owner, can register a keeper)', value: 'deploy' },
      { name: 'Enter existing contract addresses manually', value: 'manual' },
    ],
  });

  if (mode === 'deploy') {
    try {
      return await deployFresh(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ Deployment failed: ${message}`);
      process.exit(1);
    }
  }

  return promptAddresses(state);
}
