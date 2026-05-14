## ADDED Requirements

### Requirement: Wizard builds shared package before launching services
The system SHALL build `@cfxdevkit/cas-shared` before starting the backend or frontend, since both depend on its compiled output.

#### Scenario: Shared build succeeds
- **WHEN** `pnpm --filter @cfxdevkit/cas-shared build` exits with code 0
- **THEN** the wizard SHALL proceed to spawn backend and frontend

#### Scenario: Shared build fails
- **WHEN** the build command exits with a non-zero code
- **THEN** the wizard SHALL display the build output and exit with code 1

### Requirement: Wizard spawns backend and frontend as supervised child processes
The system SHALL spawn the backend and frontend services as child processes after env files are written, prefix their log output with `[backend]` and `[frontend]` respectively, and keep the wizard process alive until Ctrl+C.

#### Scenario: Services start successfully
- **WHEN** both child processes start and emit initial output
- **THEN** the wizard SHALL display the prefixed log lines and a summary: "CAS is running — http://localhost:3010"

#### Scenario: Service exits unexpectedly
- **WHEN** either child process exits with a non-zero code
- **THEN** the wizard SHALL log the exit code and optionally restart (configurable; default: do not auto-restart)

#### Scenario: Ctrl+C shuts down all processes
- **WHEN** the user sends SIGINT (Ctrl+C) to the wizard
- **THEN** the wizard SHALL send SIGTERM to both child processes, wait for them to exit, and exit cleanly

### Requirement: Launch is optional (wizard can exit after writing env files)
The system SHALL ask the user whether to launch the services immediately after writing env files, allowing the user to skip launch and manage processes manually.

#### Scenario: User skips launch
- **WHEN** the user answers "No" to "Launch CAS now?"
- **THEN** the wizard SHALL print "Run 'pnpm --filter @cfxdevkit/cas-backend start' and 'pnpm --filter @cfxdevkit/cas-frontend start' to start manually" and exit cleanly
