import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ProjectContext } from '../context/types.js';

export const contractResources = [
  {
    uri: 'cfxdevkit://contracts/deployed',
    name: 'Deployed Contracts',
    description: 'Deployed contract addresses and ABIs from the current project.',
    mimeType: 'application/json',
  },
];

function json(uri: string, obj: unknown) {
  return {
    contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(obj, null, 2) }],
  };
}

export function readContractResource(uri: string, context: ProjectContext) {
  if (uri === 'cfxdevkit://contracts/deployed') {
    if (!context.deployedContracts) {
      return json(uri, {
        message: 'No deployed contracts found. Deploy contracts to populate this resource.',
        contracts: {},
      });
    }
    return json(uri, { contracts: context.deployedContracts });
  }

  // cfxdevkit://contracts/{name} — lookup by contract name
  const contractName = uri.replace('cfxdevkit://contracts/', '');
  if (context.deployedContracts?.[contractName]) {
    return json(uri, context.deployedContracts[contractName]);
  }

  // Try reading from deployments directory in project
  if (context.isProject) {
    const deploymentsFile = resolve(context.cwd, 'deployments', `${contractName}.json`);
    if (existsSync(deploymentsFile)) {
      try {
        const raw = readFileSync(deploymentsFile, 'utf8');
        return json(uri, JSON.parse(raw));
      } catch {
        // fall through
      }
    }
  }

  return json(uri, { error: `Contract "${contractName}" not found.` });
}
