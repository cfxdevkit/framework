import { AUTOMATION_MANAGER_ADDRESSES } from '@cfxdevkit/automation';
import { WCFX_ADDRESSES } from '@cfxdevkit/protocol';

export const DEFAULT_CAS_NETWORK = 'mainnet' as const;

/** Mainnet AutomationManager — sourced from @cfxdevkit/automation */
export const MAINNET_AUTOMATION_MANAGER_ADDRESS = AUTOMATION_MANAGER_ADDRESSES.mainnet;

/** Mainnet WCFX — sourced from @cfxdevkit/protocol */
export const MAINNET_WCFX_ADDRESS = WCFX_ADDRESSES.mainnet;
