#!/usr/bin/env bash
# Scaffold empty packages for the cfxdevkit monorepo.
# Idempotent: existing files are NOT overwritten.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ---------- helpers ----------

write_if_missing() {
  local path="$1"
  if [[ -e "$path" ]]; then
    echo "  skip (exists)  $path"
    return 0
  fi
  mkdir -p "$(dirname "$path")"
  cat >"$path"
  echo "  created        $path"
}

# Args: <pkg_dir> <pkg_name> <description> [react|node]
scaffold_lib() {
  local dir="$1"
  local name="$2"
  local desc="$3"
  local kind="${4:-node}"

  echo "==> $name  ($dir)"

  local jsx_dep=""
  local jsx_peer=""
  local entry_ext="ts"
  local jsx_lib_extra=""
  if [[ "$kind" == "react" ]]; then
    jsx_dep=$',\n    "@types/react": "^19.0.0",\n    "react": "^19.0.0"'
    jsx_peer=$',\n  "peerDependencies": {\n    "react": "^19.0.0"\n  }'
    entry_ext="ts"
  fi

  # package.json
  write_if_missing "$dir/package.json" <<JSON
{
  "name": "$name",
  "version": "0.0.0",
  "private": false,
  "description": "$desc",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md", "API.md", "STRUCTURE.md"],
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome check src",
    "clean": "rm -rf dist .vitest coverage"
  },
  "devDependencies": {
    "@cfxdevkit/tsconfig": "workspace:*",
    "@types/node": "^22.10.0",
    "@cfxdevkit/biome-config": "workspace:*",
    "@biomejs/biome": "^2.0.0",
    "typescript": "^5.7.0",
    "vite": "^7.0.0",
    "vite-plugin-dts": "^4.3.0",
    "vitest": "^3.0.0"$jsx_dep
  }$jsx_peer
}
JSON

  # tsconfig.json
  write_if_missing "$dir/tsconfig.json" <<JSON
{
  "extends": "@cfxdevkit/tsconfig/lib.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": false,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.test.tsx"]
}
JSON

  # vite.config.ts
  local vite_extra_set="new Set<string>()"
  if [[ "$kind" == "react" ]]; then
    vite_extra_set="new Set(['react', 'react-dom', 'react/jsx-runtime'])"
  fi
  write_if_missing "$dir/vite.config.ts" <<TS
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const peerExternals = $vite_extra_set;

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: (id) =>
        peerExternals.has(id) || (!id.startsWith('.') && !id.startsWith('/')),
    },
    sourcemap: true,
    minify: false,
    target: 'es2023',
  },
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
});
TS

  # vitest.config.ts (separate so build config stays minimal)
  write_if_missing "$dir/vitest.config.ts" <<TS
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    passWithNoTests: false,
    reporters: ['default'],
  },
});
TS

  # src/index.ts (placeholder export)
  write_if_missing "$dir/src/index.ts" <<TS
// Public surface for $name.
// Implementations land here as the package is filled in. See ./API.md.
export const __packageName = '$name' as const;
TS

  # src/index.test.ts (smoke test so vitest passWithNoTests=false succeeds)
  write_if_missing "$dir/src/index.test.ts" <<TS
import { describe, expect, it } from 'vitest';
import { __packageName } from './index.js';

describe('$name', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('$name');
  });
});
TS

  # moon.yml
  write_if_missing "$dir/moon.yml" <<YML
\$schema: 'https://moonrepo.dev/schemas/project.json'

type: 'library'
language: 'typescript'
platform: 'node'
YML
}

# ---------- framework ----------

scaffold_lib "framework/core"          "@cfxdevkit/core"          "Conflux RPC client, contract I/O, addresses, units, errors."
scaffold_lib "framework/services"      "@cfxdevkit/services"      "Pluggable backends: keystore, crypto, dex, tokens."
scaffold_lib "framework/wallet"        "@cfxdevkit/wallet"        "Session keys, signers, batched writes, capability policies."
scaffold_lib "framework/compiler"      "@cfxdevkit/compiler"      "Solidity compilation pipeline."
scaffold_lib "framework/devnode"       "@cfxdevkit/devnode"       "Local Conflux dev node lifecycle."
scaffold_lib "framework/contracts"     "@cfxdevkit/contracts"     "Standard contract bindings (ERC-20/721/1155, multicall3, internal)."
scaffold_lib "framework/protocol"      "@cfxdevkit/protocol"      "Conflux-specific protocol features (sponsor, cross-space, staking)."
scaffold_lib "framework/executor"      "@cfxdevkit/executor"      "Generic background job runner with queues and scheduler."
scaffold_lib "framework/react"         "@cfxdevkit/react"         "React hooks over @cfxdevkit/core." react
scaffold_lib "framework/wallet-connect" "@cfxdevkit/wallet-connect" "Browser wallet connectors and headless UI." react
scaffold_lib "framework/defi-react"    "@cfxdevkit/defi-react"    "Opinionated DeFi widgets (swap, portfolio, picker)." react
scaffold_lib "framework/theme"         "@cfxdevkit/theme"         "Design tokens and CSS layer." react
scaffold_lib "framework/testing"       "@cfxdevkit/testing"       "Shared test fixtures and matchers."

# ---------- domains ----------

scaffold_lib "domains/game-engine"     "@cfxdevkit/game-engine"   "Reusable on-chain game state engine."
scaffold_lib "domains/automation"      "@cfxdevkit/automation"    "Automation strategies (limit, dca, stop-loss, scheduled)."
scaffold_lib "domains/hardware-bridge" "@cfxdevkit/hardware-bridge" "Hardware ↔ chain bridge (ws-protocol, sensor-types)."

# ---------- platform (library packages only here) ----------

scaffold_lib "platform/mcp-server"     "@cfxdevkit/mcp-server"    "MCP server exposing devkit tools to AI agents." node
scaffold_lib "platform/scaffold-cli"   "@cfxdevkit/create"        "Project scaffolder (npm create @cfxdevkit)." node

echo
echo "Scaffolding complete."
