export function parseCommitFlags(args) {
  const promptParts = [];
  let model = null;
  let quick = false;
  let dryRun = false;
  let yes = false;
  let force = false;
  let skipChecks = false;
  let skipPostChecks = false;
  let skipChangeset = false;
  let changesetBump = null;
  let withTests = true;
  let withBuild = true;
  let agent = 'direct';
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--model') model = args[++index];
    else if (arg === '--agent') agent = args[++index];
    else if (arg === '--quick') quick = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--yes' || arg === '-y') yes = true;
    else if (arg === '--force' || arg === '-f') force = true;
    else if (arg === '--skip-checks') skipChecks = true;
    else if (arg === '--skip-post-checks') skipPostChecks = true;
    else if (arg === '--skip-changeset') skipChangeset = true;
    else if (arg === '--no-changeset') changesetBump = 'none';
    else if (arg === '--changeset-bump') changesetBump = args[++index];
    else if (arg === '--with-tests') withTests = true;
    else if (arg === '--skip-tests') withTests = false;
    else if (arg === '--with-build') withBuild = true;
    else if (arg === '--skip-build') withBuild = false;
    else promptParts.push(arg);
  }
  if (agent !== 'direct') {
    throw new Error('Commit --agent must be: direct');
  }
  if (changesetBump && !['patch', 'minor', 'major', 'none'].includes(changesetBump)) {
    throw new Error('Commit --changeset-bump must be one of: patch, minor, major');
  }
  return {
    prompt: promptParts.join(' ').trim(),
    model,
    quick,
    dryRun,
    yes,
    force,
    skipChecks,
    skipPostChecks,
    skipChangeset,
    changesetBump,
    withTests,
    withBuild,
    agent,
  };
}
