export const ESPACE_MAINNET_ID = 1030;
export const ESPACE_TESTNET_ID = 71;
export const CORE_TESTNET_ID = 1;
export const CORE_MAINNET_ID = 1029;

export function buildEip712Payload(chainId: number, address: `0x${string}` | undefined) {
  return {
    domain: {
      name: 'Conflux Showcase',
      version: '1',
      chainId,
      verifyingContract: '0x0000000000000000000000000000000000000000' as const,
    },
    types: {
      Message: [
        { name: 'wallet', type: 'address' },
        { name: 'contents', type: 'string' },
      ],
    },
    primaryType: 'Message',
    message: {
      wallet: address ?? '0x0000000000000000000000000000000000000000',
      contents: 'Hello EIP-712 from showcase-public',
    },
  };
}

export function buildCip23Payload(chainId: number, address: string | null) {
  return {
    domain: { name: 'Conflux Showcase', version: '1', chainId },
    primaryType: 'Greeting',
    types: {
      CIP23Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
      Greeting: [
        { name: 'from', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'issuedAt', type: 'uint256' },
      ],
    },
    message: {
      from: address ?? '',
      message: 'Hello CIP-23 from showcase-public',
      issuedAt: Math.floor(Date.now() / 1000),
    },
  };
}

export const ESPACE_SNIPPET = `// 1. Wrap your app with ConfluxWagmiProviders (done in providers.tsx)
import { ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect';

// 2. Use the shared wallet UI primitives from @cfxdevkit/ui
import { WalletButton, WalletPickerModal, WalletStatusChip } from '@cfxdevkit/ui';

// 3. Read wallet state with wagmi hooks
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';

const { address, isConnected, chain } = useAccount();
const { data: balance } = useBalance({ address });
const chainId = useChainId();
const { switchChain } = useSwitchChain();

<WalletButton />
<WalletStatusChip address={address} />
<WalletPickerModal open={open} onClose={() => setOpen(false)} />

switchChain({ chainId: 71 });  // → eSpace testnet
switchChain({ chainId: 1030 }); // → eSpace mainnet`;

export const CORE_SNIPPET = `// useCoreWallet talks to window.conflux — independent of wagmi
import { useCoreWallet, CORE_CHAIN_CONFIGS } from '@cfxdevkit/wallet-connect';

const core = useCoreWallet();
// core.status: 'detecting' | 'not-installed' | 'not-active' | 'connecting' | 'active'
// core.address  — Core Space address string
// core.chainId  — hex chain ID ("0x1" = testnet, "0x405" = mainnet)

await core.connect();   // opens Fluent cfx_requestAccounts popup
core.disconnect();      // resets local state (Fluent has no revoke method)

// Switch chain — pass a CoreChainConfig from the built-in map
await core.switchChain(CORE_CHAIN_CONFIGS[1]);    // testnet
await core.switchChain(CORE_CHAIN_CONFIGS[1029]); // mainnet`;

export const WALLET_ACTIONS_SNIPPET = `// eSpace actions use the wagmi wallet client.
const signature = await walletClient.signMessage({ message });
const typed = await walletClient.signTypedData({ domain, types, primaryType, message });
const hash = await walletClient.sendTransaction({ to: address, value });

// Core actions use Fluent's window.conflux provider directly.
const coreSignature = await window.conflux.request({
  method: 'cfx_signTypedData_v4',
  params: [coreAddress, JSON.stringify(cip23Payload)],
});
const coreHash = await window.conflux.request({
  method: 'cfx_sendTransaction',
  params: [{ from: coreAddress, to: coreAddress, value: '0x0' }],
});`;
