type Status = 'idle' | 'ready' | 'busy' | 'error';

interface HidNavigator extends Navigator {
  hid?: unknown;
}

export interface LedgerState {
  status: Status;
  address: string;
  coreAddress: string;
  message: string;
  rawTx: string;
  txHash: string;
  contractAddress: string;
  contractName: string;
  balance: string;
  error: string;
  activity: string;
  notice: string;
}

export const EVM_PATH = "m/44'/60'/0'/0/0";
export const CORE_PATH = "m/44'/503'/0'/0/0";

export const initialState: LedgerState = {
  status: 'idle',
  address: '',
  coreAddress: '',
  message: 'cfxdevkit keystore signer check',
  rawTx: '',
  txHash: '',
  contractAddress: '',
  contractName: '',
  balance: '',
  error: '',
  activity: '',
  notice: '',
};

export function supportsWebHid(): boolean {
  return typeof navigator !== 'undefined' && Boolean((navigator as HidNavigator).hid);
}
