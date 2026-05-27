## ADDED Requirements

### Requirement: browser-webusb-direct
showcase-public must use hd-common-connect-sdk with env:'webusb' (no iframe).
- WHEN Connect OneKey is clicked in Chrome on the host machine
- THEN navigator.usb.requestDevice() is triggered and the device is accessible

### Requirement: container-usb-access  
The devcontainer must pass /dev/bus/usb to allow Node.js USB access.
- WHEN OneKey is plugged in and signer kind is 'onekey'
- THEN createSignerSessionFromConfig() finds the device via searchDevices()

### Requirement: local-https-routing
*.dev.cfxdevkit.org must resolve to localhost and serve HTTPS via Caddy.
- WHEN Caddy is running and mkcert root CA is installed on host
- THEN https://showcase.dev.cfxdevkit.org serves the showcase-public Next.js app

### Requirement: webpack-noble-hashes
showcase-public must build cleanly with webpack (not Turbopack).
- WHEN next build --webpack runs
- THEN @noble/hashes subpath aliases resolve correctly and build succeeds
