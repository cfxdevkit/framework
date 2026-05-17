## ADDED Requirements

### Requirement: Landing page presents framework overview

The `/` route SHALL render a landing page with a framework hero section, a grid of chapter feature cards (one per chapter), and navigation links. No authentication or wallet connection SHALL be required to view the landing page.

#### Scenario: Landing loads without wallet connected
WHEN a user visits `/` without a connected wallet
THEN the page renders fully with all chapter cards visible and no error states

#### Scenario: Chapter card navigates to chapter
WHEN a user clicks a chapter card
THEN the browser navigates to the corresponding chapter route

### Requirement: Core chapter demonstrates RPC and codec operations

The `/core` route SHALL demonstrate: listing available chains, making a live RPC call to `eth_blockNumber` on eSpace testnet via the proxy, and performing a base32 ↔ hex address codec round-trip.

#### Scenario: Chain list is displayed
WHEN the `/core` page loads
THEN a table of available chains (eSpace testnet, eSpace mainnet, Core testnet) is rendered with chainId and RPC URL

#### Scenario: Live block number fetches via proxy
WHEN the user clicks "Fetch Block Number"
THEN a request is sent to `/api/rpc/espace` and the returned block number is displayed in a LogBox entry

#### Scenario: Address codec round-trip
WHEN the user types a valid base32 CFX address into the codec panel and clicks convert
THEN the hex equivalent is displayed below the input

#### Scenario: Unit formatting is demonstrated
WHEN the unit formatter panel renders
THEN examples of `formatCFX(1_000_000_000_000_000_000n)`, `formatGDrip(1_000_000_000n)`, and `parseCFX("1.5")` are shown with their results

### Requirement: Wallet chapter demonstrates connection and balance

The `/wallet` route SHALL demonstrate ConnectButton, wallet connection via Fluent (`useCoreWallet`) and wagmi, `useBalance`, and chain switching.

#### Scenario: ConnectButton triggers wallet picker
WHEN a user clicks the ConnectButton in the wallet chapter
THEN WalletPickerModal opens showing available wallet options

#### Scenario: Connected address and balance are displayed
WHEN a wallet is connected
THEN the account address and CFX balance are shown using `useAccount` and `useBalance`

#### Scenario: Chain switch works for eSpace
WHEN a user clicks "Switch to eSpace Testnet"
THEN wagmi's `useSwitchChain` is invoked and the page reflects the new chainId

### Requirement: Keys chapter demonstrates mnemonic and derivation

The `/keys` route SHALL demonstrate mnemonic generation, validation, and HD account derivation, all running entirely in-browser via `@cfxdevkit/core`.

#### Scenario: New mnemonic is generated
WHEN the user clicks "Generate Mnemonic"
THEN a 12-word BIP39 mnemonic is displayed

#### Scenario: Mnemonic validation indicates validity
WHEN the user types a mnemonic into the validation input
THEN a valid mnemonic shows a green StatusBadge and an invalid one shows a red StatusBadge

#### Scenario: Account derivation produces addresses
WHEN the user enters a mnemonic and clicks "Derive Accounts"
THEN `deriveDualAccounts` is called and both the eSpace and Core addresses for account index 0 are displayed

### Requirement: SIWE chapter demonstrates sign-in with Ethereum

The `/siwe` route SHALL demonstrate the complete SIWE flow: nonce request → message construction → wallet signing → server-side verification → JWT display.

#### Scenario: Nonce is fetched from API
WHEN a connected wallet user clicks "Request Nonce"
THEN GET `/api/auth/nonce?address={address}` is called and a nonce string is displayed

#### Scenario: SIWE message is constructed and signed
WHEN the user clicks "Sign Message"
THEN a SIWE message is constructed via `createSiweMessage`, the wallet is prompted to sign it, and the signature is displayed

#### Scenario: Verification returns JWT payload
WHEN a valid signature is submitted to `/api/auth/verify`
THEN the decoded JWT payload (address, iat, exp) is displayed in a DemoCard
THEN no session token is persisted past the demo panel

### Requirement: DeFi chapter showcases DeFi components

The `/defi` route SHALL render `TokenPicker` with a static eSpace testnet token list, `PortfolioTable` for a connected wallet, and a `SwapWidget` shell with a "bring your own adapter" notice.

#### Scenario: TokenPicker opens and shows tokens
WHEN the user clicks the TokenPicker trigger
THEN a modal with WCFX, USDT, and ETH tokens is displayed with their icons

#### Scenario: PortfolioTable shows balances for connected wallet
WHEN a wallet is connected and the portfolio table renders
THEN `useTokenBalance` is called for each token and balances are displayed

#### Scenario: SwapWidget shell is visible without adapter
WHEN the defi page loads
THEN SwapWidget renders with a notice explaining a DexAdapter is required for live swaps

### Requirement: UI Kit chapter catalogs components and tokens

The `/ui-kit` route SHALL render every component from `@cfxdevkit/example-showcase-ui` in a catalog format, a theme toggle that switches between dark and light mode, and a CSS design token reference table.

#### Scenario: Theme toggles between dark and light
WHEN the user clicks the theme toggle on the UI Kit page
THEN `ThemeProvider` switches the theme and all components visually update

#### Scenario: Token table displays all CSS variables
WHEN the UI Kit page loads
THEN a table of all `--cfx-color-*`, `--cfx-space-*`, and `--cfx-radius-*` tokens is shown with their resolved values
