#!/usr/bin/env bash
set -euo pipefail

workspace="${containerWorkspaceFolder:-${GITHUB_WORKSPACE:-/workspaces/root}}"
cd "$workspace"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not available; skipping GitNexus registration."
  exit 0
fi

if command -v sudo >/dev/null 2>&1; then
  sudo mkdir -p "$HOME/.local/share/gitnexus"
  sudo chown -R "${USER:-node}:${USER:-node}" "$HOME/.local/share/gitnexus"
else
  mkdir -p "$HOME/.local/share/gitnexus"
fi

mkdir -p "$HOME/.gitnexus"

registry_path="$HOME/.gitnexus/registry.json"

gitnexus() {
  pnpm exec gitnexus "$@"
}

derive_repo_alias() {
  local repo_dir="$1"
  if [[ "$repo_dir" == "$workspace" ]]; then
    printf 'framework\n'
    return
  fi

  local relative_path="${repo_dir#"$workspace"/}"
  relative_path="${relative_path//\//-}"
  relative_path="${relative_path//./-}"
  relative_path="$(printf '%s' "$relative_path" | sed -E 's/[^[:alnum:]-]+/-/g; s/-+/-/g; s/^-//; s/-$//')"
  printf 'framework-%s\n' "$relative_path"
}

has_expected_registration() {
  local repo_dir="$1"
  local alias="$2"
  if [[ ! -f "$registry_path" ]]; then
    return 1
  fi

  node - "$registry_path" "$repo_dir" "$alias" <<'NODE' >/dev/null
const fs = require('node:fs');

const [, , registryPath, repoDir, alias] = process.argv;
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const match = registry.some((entry) => entry.path === repoDir && entry.name === alias);
process.exit(match ? 0 : 1);
NODE
}

has_path_registration() {
  local repo_dir="$1"
  local registry="$2"
  printf '%s\n' "$registry" | grep -F "Path:    $repo_dir" >/dev/null
}

register_repo() {
  local repo_dir="$1"
  local registry="$2"

  if has_path_registration "$repo_dir" "$registry"; then
    return
  fi

  if [[ "$repo_dir" == "$workspace" ]]; then
    gitnexus analyze --name "$(derive_repo_alias "$repo_dir")" >/dev/null || true
    return
  fi

  if ! has_path_registration "$repo_dir" "$registry"; then
    gitnexus index "$repo_dir" --allow-non-git >/dev/null || true
  fi
}

normalize_registry_aliases() {
  local repo_dir
  if [[ ! -f "$registry_path" ]]; then
    return
  fi

  node - "$workspace" "$registry_path" "$@" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const [, , workspace, registryPath, ...repoDirs] = process.argv;

function deriveAlias(repoDir) {
  if (repoDir === workspace) {
    return 'framework';
  }

  const relativePath = path
    .relative(workspace, repoDir)
    .replace(/[/.]+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `framework-${relativePath}`;
}

const managedAliases = new Map(repoDirs.map((repoDir) => [repoDir, deriveAlias(repoDir)]));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
let changed = false;

for (const entry of registry) {
  const alias = managedAliases.get(entry.path);
  if (!alias) {
    continue;
  }
  if (entry.name !== alias) {
    entry.name = alias;
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
}
NODE
}

declare -A repo_dirs=()
repo_dirs["$workspace"]=1

while IFS= read -r gitnexus_dir; do
  repo_dirs["$(dirname "$gitnexus_dir")"]=1
done < <(find "$workspace" -path '*/.gitnexus' -type d -print 2>/dev/null)

registry="$(gitnexus list 2>/dev/null || true)"
while IFS= read -r repo_dir; do
  [[ -n "$repo_dir" ]] || continue
  register_repo "$repo_dir" "$registry"
  registry="$(gitnexus list 2>/dev/null || true)"
done < <(printf '%s\n' "${!repo_dirs[@]}" | sort)

mapfile -t managed_repo_dirs < <(printf '%s\n' "${!repo_dirs[@]}" | sort)
normalize_registry_aliases "${managed_repo_dirs[@]}"

root_alias="$(derive_repo_alias "$workspace")"
if has_expected_registration "$workspace" "$root_alias"; then
  echo "GitNexus registered for $workspace as $root_alias"
else
  echo "GitNexus registration unavailable; run '.devcontainer/scripts/ensure-gitnexus.sh' or 'pnpm exec gitnexus analyze --name $root_alias' manually if needed."
fi