Podman vs Docker networking notes

- Podman (rootless, modern): prefer `pasta` network with gateway mapping so containers can reach host services.
  Example run:

    podman run --rm --network pasta:--map-gw --add-host=host.containers.internal:host-gateway <image>

  From inside container use:

    curl http://host.containers.internal:13305/

- Slirp4netns (alternate): allow loopback if you need access to host loopback:

    podman run --rm --network slirp4netns:allow_host_loopback=true <image>

- Docker (Linux): `host.docker.internal` or `--network host` work. Docker-equivalent runArgs for devcontainer on Linux:

    ["--network", "host", "--add-host=host.docker.internal:host-gateway"]

- Host requirements:
  - Ensure the service binds to 0.0.0.0 (not 127.0.0.1).
  - Enable IP forwarding if using bridge networking: `sudo sysctl -w net.ipv4.ip_forward=1`.
  - Allow the port through the firewall if necessary (Fedora/firewalld):

    sudo firewall-cmd --add-port=13305/tcp --permanent
    sudo firewall-cmd --reload

- Devcontainer guidance:
  - For Podman rootless, the `devcontainer.json` includes `runArgs`: `"--network","pasta:--map-gw","--add-host=host.containers.internal:169.254.1.2"`.
  - For Docker on Linux, use the host network or `host.docker.internal` as shown above.

If you want, I can update `detect-docker-socket.sh` to write the correct host mapping into a file and have `devcontainer.json` reference it dynamically.