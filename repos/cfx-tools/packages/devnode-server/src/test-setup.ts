import { vi } from 'vitest';
import { deployContractMock, readContractMock, sendWriteMock } from './index.test-support.js';

vi.mock('@cfxdevkit/contracts/deploy', () => ({
  deployContract: deployContractMock,
}));

vi.mock('@cfxdevkit/contracts/read', () => ({
  readContract: readContractMock,
}));

vi.mock('@cfxdevkit/contracts/write', () => ({
  sendWrite: sendWriteMock,
}));

// sendCoreFunds / sendEspaceFunds moved to @cfxdevkit/devnode-core after the split.
// They are injected via createDevnodeServerApp options — no module mock needed.
