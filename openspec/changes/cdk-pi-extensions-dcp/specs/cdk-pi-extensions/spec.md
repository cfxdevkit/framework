# cdk-pi-extensions Specification

## Purpose

Establish a local npm package (`@cfxdevkit/pi-extensions`) that serves as a centralized registry for project-local extensions and skills, enabling team onboarding via `pi install` and ensuring extensions survive cold starts and rebuilds.

## Requirements

Requirement: The `pi-extensions` package SHALL have a `package.json` with a valid `pi` manifest containing `extensions` and `skills` paths

#### Scenario: Package manifest is valid
- **WHEN** the `package.json` at `repos/cfx-tools/infra/pi-extensions/package.json` is read
- **THEN** it SHALL contain a `pi` object with `extensions` (array of paths) and `skills` (array of paths) properties, and `keywords` SHALL include `"pi-package"`

---

Requirement: The package SHALL be listed in `.pi/settings.json` packages array

#### Scenario: Package is registered in settings
- **WHEN** `.pi/settings.json` is read
- **THEN** the `packages` array SHALL include a reference to `./repos/cfx-tools/infra/pi-extensions`

---

Requirement: Extensions in the package SHALL load on session start

#### Scenario: Extensions auto-load from package
- **WHEN** a Pi session starts with the package in `settings.json` packages
- **THEN** all extensions registered via the `pi` manifest extensions path SHALL be loaded before the agent starts

---

Requirement: The package structure SHALL support team onboarding

#### Scenario: Team member can install after cold start
- **WHEN** a team member clones the repository and starts Pi
- **THEN** all extensions from `@cfxdevkit/pi-extensions` SHALL be loaded automatically without manual configuration

---

Requirement: Extensions SHALL load in numeric order (prefix-ordered)

#### Scenario: Extensions load in defined order
- **WHEN** multiple extension files exist in the package's extensions directory
- **THEN** extensions prefixed `00-`, `01-`, `02-` SHALL load in that numeric sequence
