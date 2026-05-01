#!/usr/bin/env bash
set -euo pipefail

workspace="${containerWorkspaceFolder:-/workspaces/root}"
extension_source="$workspace/repos/cfx-tools/packages/vscode-extension"
manifest="$extension_source/package.json"
build_mode="${1:-}"

if [[ ! -f "$manifest" ]]; then
  echo "[cfxdevkit] VS Code extension manifest not found: $manifest"
  exit 0
fi

if [[ ! -f "$extension_source/dist/extension.js" ]]; then
  if [[ "$build_mode" == "--build" ]]; then
    pnpm --dir "$workspace" --filter cfxdevkit-vscode-extension... build
  else
    echo "[cfxdevkit] VS Code extension is not built yet; skipping local install."
    exit 0
  fi
fi

extension_name="$(node -p "require(process.argv[1]).name" "$manifest")"
extension_publisher="$(node -p "require(process.argv[1]).publisher" "$manifest")"
extension_version="$(node -p "require(process.argv[1]).version" "$manifest")"
extension_id="$extension_publisher.$extension_name"
install_dir_name="$extension_id-$extension_version"

for extensions_root in "$HOME/.vscode-server/extensions" "$HOME/.vscode-remote/extensions"; do
  mkdir -p "$extensions_root"

  for stale_path in "$extensions_root/$extension_id"-* "$extensions_root/local.$extension_name"-*; do
    if [[ -e "$stale_path" || -L "$stale_path" ]]; then
      rm -rf "$stale_path"
    fi
  done

  ln -s "$extension_source" "$extensions_root/$install_dir_name"
done

echo "[cfxdevkit] Installed local VS Code extension: $extension_id@$extension_version"