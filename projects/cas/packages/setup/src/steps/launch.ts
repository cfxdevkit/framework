import { execSync } from 'node:child_process';
import { confirm } from '@inquirer/prompts';
import { startProcesses } from '../runner.js';
import type { WizardState } from '../wizard.js';

export async function launch(state: WizardState): Promise<WizardState> {
  console.log('\n── Launch ────────────────────────────────────────────');

  const shouldLaunch = await confirm({
    message: 'Launch CAS now? (starts backend and frontend)',
    default: true,
  });

  if (!shouldLaunch) {
    console.log('\nTo start CAS manually, run from the projects/cas/ directory:');
    console.log("  pnpm --filter @cfxdevkit/cas-backend start");
    console.log("  pnpm --filter @cfxdevkit/cas-frontend start");
    return state;
  }

  // Build shared package first
  const casRoot = process.cwd();
  console.log('\nBuilding @cfxdevkit/cas-shared…');
  try {
    execSync('pnpm --filter @cfxdevkit/cas-shared build', {
      cwd: casRoot,
      stdio: 'inherit',
    });
    console.log('✓ Shared package built');
  } catch {
    console.error('✗ Shared build failed — cannot launch services');
    process.exit(1);
  }

  console.log('\nStarting CAS services…');
  console.log('  Backend: http://localhost:3011');
  console.log('  Frontend: http://localhost:3010');
  console.log('\nPress Ctrl+C to stop all services.\n');

  startProcesses(casRoot);

  // Keep the wizard process alive — exit is handled via SIGINT in runner.ts
  await new Promise<never>(() => { /* stays alive until SIGINT */ });

  return state;
}
