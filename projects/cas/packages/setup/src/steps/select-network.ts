import { input, select } from '@inquirer/prompts';
import {
  automationManagerAddress,
  permitHandlerAddress,
  swappiPriceAdapterAddress,
} from '@cfxdevkit/protocol';
import type { Network, WizardState } from '../wizard.js';
import { checkRpc } from './check-env.js';

// Chain IDs
const TESTNET_ID = 71 as const;
const MAINNET_ID = 1030 as const;

// WCFX token addresses (not in protocol package — well-known constants)
const WCFX_ADDRESS: Record<string, string> = {
  testnet: '0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8',
  mainnet: '0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b',
  local: '',
};

const DEFAULT_RPC: Record<string, string> = {
  testnet: 'https://evmtestnet.confluxrpc.com',
  mainnet: 'https://evm.confluxrpc.com',
  local: 'http://127.0.0.1:8545',
};

const SWAPPI_ROUTER = '0x62B0873055Bf896Dd869e172119871ac24aeA305';

function addressesForNetwork(network: 'testnet' | 'mainnet'): {
  automationManagerAddress: string;
  permitHandlerAddress: string;
  priceAdapterAddress: string;
  wcfxAddress: string;
} {
  const chainId = network === 'testnet' ? TESTNET_ID : MAINNET_ID;
  return {
    automationManagerAddress: automationManagerAddress[chainId],
    permitHandlerAddress: permitHandlerAddress[chainId],
    priceAdapterAddress: swappiPriceAdapterAddress[chainId],
    wcfxAddress: WCFX_ADDRESS[network] ?? '',
  };
}

export async function selectNetwork(state: WizardState): Promise<WizardState> {
  console.log('\n── Network Selection ─────────────────────────────────');

  const network = await select<Network>({
    message: 'Select target network:',
    choices: [
      { name: 'Testnet (eSpace, chain 71)', value: 'testnet' },
      { name: 'Mainnet (eSpace, chain 1030)', value: 'mainnet' },
      { name: 'Local devnode', value: 'local' },
    ],
  });

  // Determine default RPC URL
  let rpcUrl = DEFAULT_RPC[network] ?? '';

  // Prompt for custom RPC override
  const customRpc = await input({
    message: `RPC URL (press Enter to use default: ${rpcUrl}):`,
  });
  if (customRpc.trim()) {
    rpcUrl = customRpc.trim();
  }

  // Verify RPC connectivity (retries until reachable or user aborts)
  const verifiedUrl = await checkRpc(rpcUrl);

  // Build updated state
  const addresses =
    network === 'testnet' || network === 'mainnet'
      ? addressesForNetwork(network)
      : {
          automationManagerAddress: '',
          permitHandlerAddress: '',
          priceAdapterAddress: '',
          wcfxAddress: '',
        };

  return {
    ...state,
    network,
    rpcUrl: verifiedUrl,
    swappiRouterAddress: SWAPPI_ROUTER,
    ...addresses,
  };
}
