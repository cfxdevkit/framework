import type { ContractRecord } from './contracts.js';

export interface BootstrapTemplateSummary {
  contractName: string;
  description: string;
  id: string;
  name: string;
  solcVersion: string;
}

export interface BootstrapTemplate extends BootstrapTemplateSummary {
  source?: string;
}

export interface BootstrapCatalogResponse {
  ok: boolean;
  templates: BootstrapTemplateSummary[];
}

export interface BootstrapTemplateResponse {
  ok: boolean;
  template: BootstrapTemplate;
}

export interface BootstrapDeployInput {
  constructorArgs?: unknown[];
  senderIndex?: number;
  templateId: string;
}

export interface BootstrapDeployResponse {
  contract: ContractRecord | null;
  contractAddress: string | null;
  contractName: string;
  ok: boolean;
  templateId: string;
  txHash: string;
}
