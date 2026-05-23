import {
  defaultHardLimit,
  defaultSince,
  defaultSoftLimit,
  type HotspotOptions,
  type KebabGroupOptions,
  type RepoValidationStepId,
  type UnitConfigOptions,
} from './types.js';

const validationStepIds = new Set<RepoValidationStepId>([
  'gitnexus-analyze',
  'format',
  'lint',
  'typecheck',
  'test',
  'hotspots',
  'kebab-groups',
  'check',
]);

export type HotspotsInvocation = {
  outputMode: 'text' | 'json';
  options: HotspotOptions;
  forwardedArgs: string[];
};

export type KebabGroupsInvocation = {
  outputMode: 'text' | 'json';
  options: KebabGroupOptions;
  forwardedArgs: string[];
};

export type UnitConfigsInvocation = {
  outputMode: 'text' | 'json';
  options: UnitConfigOptions;
  forwardedArgs: string[];
};

export type RepoCommandInvocation = {
  outputMode: 'text' | 'json';
  forwardedArgs: string[];
};

export type ValidationInvocation = {
  outputMode: 'text' | 'json';
  continueOnError: boolean;
  selectedSteps: RepoValidationStepId[];
  forwardedArgs: string[];
};

export function parseHotspotsArgs(args: readonly string[]): HotspotsInvocation {
  const options: HotspotOptions = {
    softLimit: defaultSoftLimit,
    hardLimit: defaultHardLimit,
    since: defaultSince,
    failOnHard: false,
    json: false,
  };
  const forwardedArgs: string[] = [];
  let outputMode: 'text' | 'json' = 'text';

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--json') {
      outputMode = 'json';
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--soft-limit') {
      const value = Number(args[++index]);
      options.softLimit = value;
      forwardedArgs.push(arg, String(value));
      continue;
    }
    if (arg === '--hard-limit') {
      const value = Number(args[++index]);
      options.hardLimit = value;
      forwardedArgs.push(arg, String(value));
      continue;
    }
    if (arg === '--since') {
      const value = String(args[++index]);
      options.since = value;
      forwardedArgs.push(arg, value);
      continue;
    }
    if (arg === '--fail-on-hard') {
      options.failOnHard = true;
      forwardedArgs.push(arg);
      continue;
    }
    throw new Error(`Unsupported hotspots flag: ${arg}`);
  }

  if (!Number.isFinite(options.softLimit) || options.softLimit <= 0) {
    throw new Error('--soft-limit must be a positive number');
  }
  if (!Number.isFinite(options.hardLimit) || options.hardLimit <= 0) {
    throw new Error('--hard-limit must be a positive number');
  }
  if (options.softLimit > options.hardLimit) {
    throw new Error('--soft-limit must be less than or equal to --hard-limit');
  }

  return { outputMode, options, forwardedArgs };
}

export function parseKebabGroupsArgs(args: readonly string[]): KebabGroupsInvocation {
  const options: KebabGroupOptions = {
    json: false,
    failOnGroups: false,
    minGroupSize: 2,
  };
  const forwardedArgs: string[] = [];
  let outputMode: 'text' | 'json' = 'text';

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--json') {
      outputMode = 'json';
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--fail-on-groups') {
      options.failOnGroups = true;
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--min-group-size') {
      const value = Number(args[++index]);
      options.minGroupSize = value;
      forwardedArgs.push(arg, String(value));
      continue;
    }
    throw new Error(`Unsupported kebab-groups flag: ${arg}`);
  }

  if (!Number.isFinite(options.minGroupSize) || options.minGroupSize < 2) {
    throw new Error('--min-group-size must be a number greater than or equal to 2');
  }

  return { outputMode, options, forwardedArgs };
}

export function parseUnitConfigsArgs(args: readonly string[]): UnitConfigsInvocation {
  const options: UnitConfigOptions = {
    json: false,
    write: false,
    failOnDrift: false,
  };
  const forwardedArgs: string[] = [];
  let outputMode: 'text' | 'json' = 'text';

  for (const arg of args) {
    if (arg === '--json') {
      outputMode = 'json';
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--write') {
      options.write = true;
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--fail-on-drift') {
      options.failOnDrift = true;
      forwardedArgs.push(arg);
      continue;
    }
    throw new Error(`Unsupported unit-configs flag: ${arg}`);
  }

  return { outputMode, options, forwardedArgs };
}

export function parseRepoCommandArgs(args: readonly string[]): RepoCommandInvocation {
  const forwardedArgs: string[] = [];
  let outputMode: 'text' | 'json' = 'text';

  for (const arg of args) {
    if (arg === '--json') {
      outputMode = 'json';
      continue;
    }
    forwardedArgs.push(arg);
  }

  return { outputMode, forwardedArgs };
}

export function parseValidationArgs(args: readonly string[]): ValidationInvocation {
  const forwardedArgs: string[] = [];
  const selectedSteps: RepoValidationStepId[] = [];
  let outputMode: 'text' | 'json' = 'text';
  let continueOnError = true;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--json') {
      outputMode = 'json';
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--continue-on-error') {
      continueOnError = true;
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--stop-on-error') {
      continueOnError = false;
      forwardedArgs.push(arg);
      continue;
    }
    if (arg === '--step') {
      const value = args[++index] as RepoValidationStepId | undefined;
      if (!value || !validationStepIds.has(value)) {
        throw new Error(`Unsupported validation step: ${value ?? '(missing)'}`);
      }
      selectedSteps.push(value);
      forwardedArgs.push(arg, value);
      continue;
    }
    throw new Error(`Unsupported validation flag: ${arg}`);
  }

  return { outputMode, continueOnError, selectedSteps, forwardedArgs };
}
