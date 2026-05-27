## ADDED Requirements

### Requirement: hd-web-sdk-loads
The OneKey hardware panel must initialise without bundler or runtime errors.

#### Scenario: Next.js dev and build
- **WHEN** `next dev` and `next build` run
- **THEN** no "Cannot resolve" or Node.js native module errors appear
- **THEN** the OneKey panel renders without a JavaScript exception

#### Scenario: SDK init success
- **WHEN** the user clicks "Connect OneKey" in Chrome
- **THEN** `HardwareWebSdk.init({ connectSrc: 'https://jssdk.onekey.so/' })` succeeds
- **THEN** no 8-second timeout error is shown

### Requirement: eip6963-default-on
EIP-6963 provider discovery must be enabled by default in `createConfluxWagmiConfig`.

#### Scenario: default config
- **WHEN** `createConfluxWagmiConfig()` is called with no arguments
- **THEN** `multiInjectedProviderDiscovery` is `true` in the resulting wagmi config

### Requirement: onekey-not-rejected-as-fluent
The OneKey browser extension must not be rejected by `isFluentProvider`.

#### Scenario: OneKey provider
- **WHEN** `isFluentProvider({ isFluent: true, isOneKey: true })` is called
- **THEN** it returns `false`

#### Scenario: Fluent provider
- **WHEN** `isFluentProvider({ isFluent: true, isOneKey: false })` is called
- **THEN** it returns `true`

#### Scenario: literal window.fluent
- **WHEN** `isFluentProvider(window.fluent)` is called and `window.fluent` is set
- **THEN** it returns `true`
