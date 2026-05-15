## ADDED Requirements

### Requirement: Package exports framework-based UI components

`packages/showcase-ui` SHALL export `Shell`, `Sidebar`, `DemoCard`, `LogBox`, `CodeSnippet`, and `StatusBadge` components. It SHALL NOT export any bespoke wallet state management or theme CSS variables — those come from `@cfxdevkit/wallet-connect` and `@cfxdevkit/theme` respectively.

#### Scenario: Shell renders navigation and content area
WHEN `<Shell nav={...} sidebar={...}>` is rendered with children
THEN a top navigation bar, a left sidebar, and a main content area are visible

#### Scenario: DemoCard displays a titled section with description
WHEN `<DemoCard title="Example" description="What this shows">` is rendered with children
THEN a bordered card with the title, description, and children content is visible

#### Scenario: LogBox displays timestamped log entries
WHEN `<LogBox entries={[{level: 'info', message: 'ok', ts: Date.now()}]} />` is rendered
THEN each entry is shown with its timestamp, colored by level (info/warn/error)

#### Scenario: CodeSnippet renders syntax-highlighted code
WHEN `<CodeSnippet lang="ts" code="const x = 1" />` is rendered
THEN the code is displayed in a monospace block with copy-to-clipboard functionality

#### Scenario: StatusBadge reflects status states
WHEN `<StatusBadge status="ok" />`, `<StatusBadge status="error" />`, or `<StatusBadge status="pending" />` is rendered
THEN the badge uses the corresponding `@cfxdevkit/theme` feedback color token (success/danger/warning)

### Requirement: Package uses framework design tokens exclusively

The `showcase-ui` package SHALL import `@cfxdevkit/theme/css` as a side-effect and use only `var(--cfx-color-*)`, `var(--cfx-space-*)`, `var(--cfx-radius-*)`, and `var(--cfx-text-*)` CSS custom properties in its styles. No custom `--bg`, `--panel`, `--accent`, or `--border` variables SHALL be defined.

#### Scenario: Package styles resolve with theme CSS loaded
WHEN `@cfxdevkit/theme/css` is imported before any showcase-ui component is rendered
THEN all component styles apply correctly with the dark theme tokens

#### Scenario: Package styles respond to theme switching
WHEN `ThemeProvider` switches from dark to light
THEN showcase-ui components visually update because they reference `--cfx-color-*` tokens that change under `[data-theme="dark"]`

### Requirement: Package re-exports wallet-connect UI

The `showcase-ui` package SHALL re-export `ConnectButton` and `WalletPickerModal` from `@cfxdevkit/wallet-connect/ui` so consuming apps have a single import point for all shared UI primitives.

#### Scenario: ConnectButton is available from showcase-ui
WHEN a showcase app imports `{ ConnectButton } from '@cfxdevkit/example-showcase-ui'`
THEN the component is available and functions identically to the direct import from `@cfxdevkit/wallet-connect/ui`
