export interface DeployedContractEntry {
  name: string;
  address: string;
  abi?: unknown[];
  network?: string;
  deployedAt?: number;
}

export type DeployedContracts = Record<string, DeployedContractEntry>;

export interface McpConfig {
  servers?: Record<string, unknown>;
}

export interface ProjectContext {
  cwd: string;
  isProject: boolean;
  projectName: string | null;
  projectVersion: string | null;
  isMonorepo: boolean;
  deployedContracts: DeployedContracts | null;
  hasFrontend: boolean;
  mcpConfig: McpConfig | null;
}
