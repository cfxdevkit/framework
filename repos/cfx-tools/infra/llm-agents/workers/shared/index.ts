import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const execFileAsync = promisify(execFile);

export const root = process.cwd();
export const workerDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const artifactsRoot = join(root, 'artifacts', 'llm');
export const configDir = join(artifactsRoot, 'config');
export const configPathEnvVar = 'CFXDEVKIT_LLM_CONFIG_PATH';
export const configPath = join(configDir, 'llm.json');
export const legacyConfigPath = join(configDir, 'lemonade.json');
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
  repoActions,
  type RepoActionDefinition,
  type RepoActionMode,
  type RepoActionName,
  type RepoActionUiMetadata,
} from './repo-actions.ts';

export const QUALITY_GATES = [
  {
    id: 'lint',
    label: 'Lint',
    cmd: 'pnpm',
    args: ['run', 'lint'],
    required: true,
    timeoutMs: 120000,
  },
  {
    id: 'typecheck',
    label: 'Typecheck',
    cmd: 'pnpm',
    args: ['run', 'typecheck'],
    required: true,
    timeoutMs: 180000,
  },
  {
    id: 'validate:repos',
    label: 'Repo validation',
    cmd: 'node',
    args: ['scripts/validate-repos.mjs'],
    required: true,
    timeoutMs: 30000,
  },
  {
    id: 'build',
    label: 'Build',
    cmd: 'pnpm',
    args: ['exec', 'moon', 'run', ':build', '--concurrency', '4'],
    required: false,
    timeoutMs: 300000,
  },
  {
    id: 'test',
    label: 'Test',
    cmd: 'pnpm',
    args: ['exec', 'moon', 'run', ':test', '--concurrency', '1'],
    required: true,
    timeoutMs: 600000,
  },
];
