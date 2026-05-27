## Context
- Browser WebUSB works on localhost without HTTPS (spec exemption) and on any HTTPS origin
- hd-web-sdk iframe approach is broken: USB permissions are per-origin, not delegated to cross-origin iframes  
- hd-common-connect-sdk with env:'webusb' is the correct browser WebUSB approach
- @noble/hashes v2.2.0 renamed subpaths (blake2b→blake2, sha256→sha2) — webpack aliases fix this
- Container needs --device /dev/bus/usb + CAP_NET_BIND_SERVICE for USB + port 443
- Caddy terminates TLS on 443, routes by hostname matching dev.cfxdevkit.org subdomains
- mkcert root CA installed once per developer host machine via pnpm run setup:trust-local-ca

## Service Map
| Subdomain | Local | VPS |
|---|---|---|
| showcase.dev.cfxdevkit.org | :3010 | showcase.cfxdevkit.org |
| devnode.dev.cfxdevkit.org | :52000 | local only |
| devmcp.dev.cfxdevkit.org | :3021 | local only |
| mcp.dev.cfxdevkit.org | :3020 | mcp.cfxdevkit.org |
| local.dev.cfxdevkit.org | :3011 | local only |
| cas/api/docs | ports TBD | future |
