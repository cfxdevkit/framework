import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const execFileAsync = promisify(execFile);

export const root = process.cwd();
export const workerDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const artifactsRoot = join(root, 'artifacts', 'llm');
export const configDir = join(artifactsRoot, 'config');
export const piConfigDir = join(root, '.pi');
export const configPathEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';
/** Preserved agent config path — not overridden by --github or --local PI session temp configs. */
export const agentConfigPathEnvVar = 'CFXDEVKIT_LLM_AGENT_CONFIG_PATH';
export const configPath = join(piConfigDir, 'providers.json');
export const legacyConfigPath = join(configDir, 'llm.json');
export const legacyCompatConfigPath = join(configDir, 'lemonade.json');
export const defaultBaseUrls = [
  'http://localhost:13305/',
  'http://127.0.0.1:13305/',
  'http://host.docker.internal:13305/',
  'http://host.containers.internal:13305/',
  'http://127.0.0.1:8000/',
];
export const modelPaths = ['/api/v1/models', '/v1/models', '/models'];
export const chatPaths = ['/api/v1/chat/completions', '/v1/chat/completions', '/chat/completions'];
export {
  getRepoAction,
  listRepoActions,
  type RepoActionDefinition,
  type RepoActionMode,
  type RepoActionName,
  type RepoActionUiMetadata,
  repoActions,
} from './repo-actions.ts';

export const QUALITY_GATE_SPECS = [
  {
    id: 'gitnexus-analyze',
    label: 'GitNexus analyze',
    target: 'gitnexus-analyze',
    required: true,
    timeoutMs: 300000,
  },
  { id: 'format', label: 'Format write', target: 'format', required: true, timeoutMs: 180000 },
  { id: 'lint', label: 'Lint', target: 'lint', required: true, timeoutMs: 120000 },
  { id: 'typecheck', label: 'Typecheck', target: 'typecheck', required: true, timeoutMs: 180000 },
  { id: 'test', label: 'Test', target: 'test', required: true, timeoutMs: 600000 },
  { id: 'build', label: 'Build', target: 'build', required: true, timeoutMs: 300000 },
] as const;
