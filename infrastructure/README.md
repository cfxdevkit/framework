# infrastructure/  — Deployment, CI/CD, Observability

Cross-cutting operational concerns. Code here references projects but project code
does **not** import from here.

## Structure

```
infrastructure/
├── README.md
├── STRUCTURE.md
├── ansible/             Hetzner VPS provisioning for docs, monitoring, backups
└── secrets/              Policies and templates only — NEVER actual secrets
```

## Rules

- Secrets are stored in a secret manager; this folder may only contain templates and references.
- Production signing and deploy secrets must follow [secrets/](secrets/).
- CI workflow files currently live directly in `.github/workflows/`.

## VPS

The shared Hetzner VPS hosts Dockerized runtime services behind Caddy. The first framework service is the docs site at `www.cfxdevkit.org`; CAS can keep using the same VPS until traffic or operational isolation justifies a split.

Provisioning is Ansible-based:

```sh
cd infrastructure/ansible
ansible-galaxy collection install -r requirements.yml
cp inventory.ini inventory.local.ini
cp vars/all.yml vars/local.yml
ansible-playbook playbook.yml -i inventory.local.ini -e @vars/local.yml
```
