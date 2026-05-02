# Security Policy

## Reporting a Vulnerability

Report suspected vulnerabilities privately by emailing `info@cfxdevkit.org`.
Do not create a public issue for exploitable bugs, leaked secrets, key-handling
failures, transaction-signing bypasses, or supply-chain compromise reports.

Include:

- affected package, app, or workflow
- reproduction steps or proof of concept
- expected impact and exploit preconditions
- affected versions or commit SHA, if known

## Response Targets

| Stage | Target |
|-------|--------|
| Initial acknowledgement | 2 business days |
| Triage and severity assignment | 5 business days |
| Remediation plan for confirmed high/critical issues | 10 business days |
| Coordinated public disclosure | after fix availability, unless otherwise agreed |

## Supported Versions

The repository is currently pre-release. Security fixes target `main` first and
are backported only to actively maintained release branches once they exist.

## Disclosure

We prefer coordinated disclosure. Credit is given when requested, unless the
reporter asks to remain anonymous.