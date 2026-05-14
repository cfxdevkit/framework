import { Command } from 'commander';
import { EMPTY_STATE, runWizard } from './wizard.js';

const program = new Command('cas-setup');

program
  .description('Interactive setup wizard for a CAS instance')
  .option('--force', 'Overwrite existing .env files without prompting', false)
  .action(async (options: { force: boolean }) => {
    try {
      await runWizard({ ...EMPTY_STATE, force: options.force });
      process.exit(0);
    } catch (err) {
      console.error('\n✗ Setup failed:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse(process.argv);
