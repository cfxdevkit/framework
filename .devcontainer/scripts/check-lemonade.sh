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
If Lemonade works on the host at http://localhost:13305/ but not here, the
most likely reason is that Lemonade is bound only to the host loopback
(127.0.0.1). Containers that don't use host networking cannot reach services
that only listen on loopback. To fix this without using `--network host`:

- Start Lemonade so it binds on all interfaces (example):

  lemonade --host 0.0.0.0 --port 13305

- Or configure your systemd/service unit to listen on the host IP (not
  127.0.0.1) or add a small host-side proxy that forwards the localhost port
  to a reachable host address.

If your container backend cannot use host networking, rebuild the devcontainer
so `runArgs` are applied (a container reload is not sufficient). With Podman/
VS Code, an existing container may still be using the default pasta network
until it is rebuilt from .devcontainer/devcontainer.json.
EOF