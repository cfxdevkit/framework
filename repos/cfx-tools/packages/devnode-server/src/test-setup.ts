import { vi } from 'vitest';
import {
  deployContractMock,
  readContractMock,
  sendCoreFundsMock,
  sendEspaceFundsMock,
  sendWriteMock,
} from './index.test-support.js';

vi.mock('@cfxdevkit/contracts/deploy', () => ({
  deployContract: deployContractMock,
}));

vi.mock('@cfxdevkit/contracts/read', () => ({
  readContract: readContractMock,
}));

vi.mock('@cfxdevkit/contracts/write', () => ({
  sendWrite: sendWriteMock,
}));

vi.mock('./routes/accounts-funding.js', () => ({
  sendCoreFunds: sendCoreFundsMock,
  sendEspaceFunds: sendEspaceFundsMock,
}));
