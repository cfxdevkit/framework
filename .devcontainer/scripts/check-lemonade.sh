#!/usr/bin/env bash
set -euo pipefail

urls=(
  "http://localhost:13305/api/v1/models"
  "http://127.0.0.1:13305/api/v1/models"
  "http://host.docker.internal:13305/api/v1/models"
  "http://host.containers.internal:13305/api/v1/models"
)

echo "Checking Lemonade Server connectivity from devcontainer..."
for url in "${urls[@]}"; do
  if body="$(curl -fsS --max-time 2 "$url" 2>/dev/null)"; then
    count="$(printf '%s' "$body" | node -e "let input=''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => { try { const parsed = JSON.parse(input); console.log(Array.isArray(parsed.data) ? parsed.data.length : 0); } catch { console.log('?'); } });")"
    echo "Lemonade reachable at $url ($count model(s))"
    exit 0
  fi
done

cat <<'EOF'
Lemonade Server is not reachable from this devcontainer.
If Lemonade works on the host at http://localhost:13305/ but not here, rebuild
the devcontainer and confirm it starts with host networking. With Podman/VS Code,
an existing container may still be using the default pasta network until it is
rebuilt from .devcontainer/devcontainer.json.
EOF