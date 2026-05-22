# `@cfxdevkit/ui` — Public API

> Tailwind-first reusable Conflux UI primitives built on @cfxdevkit/ui-core.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 46 symbols |
| `./shell` | 6 symbols |
| `./panel` | 6 symbols |
| `./form` | 9 symbols |
| `./data-display` | 7 symbols |
| `./feedback` | 5 symbols |
| `./wallet` | 12 symbols |

---

## `.`

### Usage

```ts
import { AppShell, Topbar } from '@cfxdevkit/ui';

const Layout = () => (
  <AppShell>
    <Topbar brand="Conflux" />
  </AppShell>
);
```

```ts
// The package name identifier
export declare const __packageName: "@cfxdevkit/ui";
// Props for the application shell layout
export interface AppShellProps {
// Props for the top navigation bar
export interface TopbarProps {
// Props for the main content grid layout
export interface MainGridProps {
// Props for the asset conversion interface
export interface AssetConversionPanelProps {
// Props for form field wrappers
export interface FieldProps {
// Props for displaying metric values and changes
export interface MetricProps {
// Props for the network switch prompt
export interface NetworkSwitchNoticeProps {
// Props for alert notifications
export interface NoticeProps {
// Props for container panels
export interface PanelProps {
// Props for the body section of a panel
export interface PanelBodyProps {
// Definition of an option within a segmented control
export interface SegmentedControlOption<TValue extends string = string> {
// Props for the segmented control component
export interface SegmentedControlProps<TValue extends string = string> {
// Props for the status grid layout
export interface StatusGridProps {
// Props for token amount input fields
export interface TokenAmountFieldProps<TToken extends TokenSelectOption = TokenSelectOption> {
// Props for the token pair selection component
export interface TokenPairSelectorProps<TToken extends TokenSelectOption = TokenSelectOption> {
// A dropdown component for selecting tokens
export interface TokenSelect<TToken extends TokenSelectOption = TokenSelectOption> {
// Props for the wallet connection button
export interface WalletButtonProps {
// Props for the wallet selection modal
export interface WalletPickerModalProps {
// Props for individual wallet provider cards
export interface WalletProviderCardProps {
// Props for the wallet connection status chip
export interface WalletStatusChipProps {
// The root layout component for the application
export declare function AppShell({ children }: AppShellProps): import("react/jsx-runtime").JSX.Element;
// The top navigation bar component
export declare function Topbar({ brand, actions }: TopbarProps): import("react/jsx-runtime").JSX.Element;
// The main content grid component
export declare function MainGrid({ sidebar, children }: MainGridProps): import("react/jsx-runtime").JSX.Element;
// The asset conversion interface component
export declare function AssetConversionPanel({ amount, amountLabel, busy, className, error, fromAssetLabel, maxAmountLabel, mode, onAmountChange, onMax, onModeChange, onSubmit, submitLabel, success, title, toAssetLabel, wrapLabel, unwrapLabel, }: AssetConversionPanelProps): import("react/jsx-runtime").JSX.Element;
// The form field wrapper component
export declare function Field({ children, className, contentClassName, hint, label, labelClassName, required, }: FieldProps): import("react/jsx-runtime").JSX.Element;
// An icon-only button component
export declare function IconButton({ title, children, ...props }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
// A component for displaying metric values and their deltas
export declare function Metric({ className, delta, deltaClassName, label, labelClassName, value, valueClassName, }: MetricProps): import("react/jsx-runtime").JSX.Element;
// A component to prompt users to switch networks
export declare function NetworkSwitchNotice({ addChainParams, buttonClassName, chainName, className, expectedChainId, message, preview, }: NetworkSwitchNoticeProps): import("react/jsx-runtime").JSX.Element | null;
// An alert notification component
export declare function Notice({ children, className, tone }: NoticeProps): import("react/jsx-runtime").JSX.Element;
// A container panel component
export declare function Panel({ title, icon, actions, children }: PanelProps): import("react/jsx-runtime").JSX.Element;
// The body section of a panel component
export declare function PanelBody({ children }: PanelBodyProps): import("react/jsx-runtime").JSX.Element;
// A segmented control selection component
export declare function SegmentedControl<TValue extends string = string>({ activeOptionClassName, className, inactiveOptionClassName, onChange, optionClassName, options, value, }: SegmentedControlProps<TValue>): import("react/jsx-runtime").JSX.Element;
// A grid component for displaying status information
export declare function StatusGrid({ children, className, columns }: StatusGridProps): import("react/jsx-runtime").JSX.Element;
// A component for inputting token amounts
export declare function TokenAmountField<TToken extends TokenSelectOption = TokenSelectOption>({ amount, amountClassName, balance, className, label, onAmountChange, onTokenChange, tokens, tokenValue, }: TokenAmountFieldProps<TToken>): import("react/jsx-runtime").JSX.Element;
// A component for selecting a pair of tokens
export declare function TokenPairSelector<TToken extends TokenSelectOption = TokenSelectOption>({ className, inputOptions, onSwap, onTokenInChange, onTokenOutChange, outputOptions, tokenInValue, tokenOutValue, }: TokenPairSelectorProps<TToken>): import("react/jsx-runtime").JSX.Element;
// A dropdown component for token selection
export declare function TokenSelect<TToken extends TokenSelectOption = TokenSelectOption>({ className, disabled, getOptionLabel, onChange, options, selectClassName, value, }: TokenSelectProps<TToken>): import("react/jsx-runtime").JSX.Element;
// A button to trigger wallet connection
export declare function WalletButton({ className, connectLabel, connectedClassName, disconnectedClassName, disconnectLabel, }: WalletButtonProps): import("react/jsx-runtime").JSX.Element;
// A modal for selecting a wallet provider
export declare function WalletPickerModal({ open, onClose, section }: WalletPickerModalProps): import("react/jsx-runtime").JSX.Element | null;
// A card representing a wallet provider
export declare function WalletProviderCard({ account, actions, chainLabel, className, connectLabel, connectPending, error, onConnect, onDisconnect, providerDescription, providerPresent, space, status, title, }: WalletProviderCardProps): import("react/jsx-runtime").JSX.Element;
// A small chip indicating wallet connection status
export declare function WalletStatusChip({ address, className, status, }: WalletStatusChipProps): import("react/jsx-runtime").JSX.Element | null;
// Props for the icon button component
export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'className' | 'type'> & {
// Available visual tones for notice components
export type NoticeTone = 'neutral' | 'info' | 'ok' | 'success' | 'warning' | 'error';
// Props for the notice component
export interface NoticeProps {
// Props for the network switch notice component
export interface NetworkSwitchNoticeProps {
// An alert notification component
export declare function Notice({ children, className, tone }: NoticeProps): import("react/jsx-runtime").JSX.Element;
// A component to prompt users to switch networks
export declare function NetworkSwitchNotice({ addChainParams, buttonClassName, chainName, className, expectedChainId, message, preview, }: NetworkSwitchNoticeProps): import("react/jsx-runtime").JSX.Element | null;
```

---

## `./shell`

### Usage

```ts
import { AppShell, Topbar, MainGrid } from '@cfxdevkit/ui/shell';

const Layout = () => (
  <AppShell>
    <Topbar brand="Conflux" />
    <MainGrid sidebar={<nav />} />
  </AppShell>
);
```

```ts
// Props for the application shell layout
export interface AppShellProps {
// Props for the top navigation bar
export interface TopbarProps {
// Props for the main content grid layout
export interface MainGridProps {
```

---

## `./panel`

### Usage

```ts
import { Panel, PanelBody } from '@cfxdevkit/ui/panel';

const MyPanel = () => (
  <Panel title="Settings">
    <PanelBody>Content here</PanelBody>
  </Panel>
);
```

```ts
// Props for container panels
export interface PanelProps {
// Props for the body section of a panel
export interface PanelBodyProps {
// Props for the asset conversion interface
export interface AssetConversionPanelProps {
```

---

## `./form`

### Usage

```ts
import { TokenSelect } from '@cfxdevkit/ui/form';

const Form = () => (
  <TokenSelect options={[{ label: 'ETH', value: 'eth' }]} />
);
```

```ts
// Props for form field wrappers
export interface FieldProps {
// Props for token amount input fields
export interface TokenAmountFieldProps<TToken extends TokenSelectOption = TokenSelectOption> {
// Props for the token pair selection component
export interface TokenPairSelectorProps<TToken extends TokenSelectOption = TokenSelectOption> {
// A dropdown component for selecting tokens
export interface TokenSelect<TToken extends TokenSelectOption = TokenSelectOption> {
```

---

## `./data-display`

### Usage

```ts
import { Metric } from '@cfxdevkit/ui/data-display';

const Stats = () => <Metric label="Price" value="$1.00" delta="+5%" />;
```

```ts
// Props for the status grid layout
export interface StatusGridProps {
// Props for displaying metric values and changes
export interface MetricProps {
// Definition of an option within a segmented control
export interface SegmentedControlOption<TValue extends string = string> {
// Props for the segmented control component
export interface SegmentedControlProps<TValue extends string = string> {
```

---

## `./feedback`

### Usage

```ts
import { Notice } from '@cfxdevkit/ui/feedback';

const Alert = () => <Notice tone="error">Something went wrong</Notice>;
```

```ts
// Available visual tones for notice components
export type NoticeTone = 'neutral' | 'info' | 'ok' | 'success' | 'warning' | 'error';
// Props for the notice component
export interface NoticeProps {
// Props for the network switch notice component
export interface NetworkSwitchNoticeProps {
```

---

## `./wallet`

### Usage

```ts
import { WalletButton } from '@cfxdevkit/ui/wallet';

const Connect = () => <WalletButton connectLabel="Connect Wallet" />;
```

```ts
// Props for the wallet connection button
export interface WalletButtonProps {
// Props for the wallet selection modal
export interface WalletPickerModalProps {
// Props for individual wallet provider cards
export interface WalletProviderCardProps {
// Props for the wallet connection status chip
export interface WalletStatusChipProps {
```

---

## Usage

```ts
// Example usage of AppShell component
import React from 'react';
import { AppShell } from '@cfxdevkit/ui';

const App = () => {
  return (
    <AppShell>
      <Topbar brand="Conflux" actions={<Button>Connect</Button>} />
      <MainGrid sidebar={<Sidebar />} children={<Content />} />
    </AppShell>
  );
};

const Sidebar = () => {
  return (
    <div>
      <h2>Sidebar</h2>
      <p>Some sidebar content</p>
    </div>
  );
};

const Content = () => {
  return (
    <div>
      <h2>Main Content</h2>
      <p>Some main content</p>
    </div>
  );
};

export default App;
```

<!-- api-hash: 15239e34230bf227f87eaea6bbd085179218f7b3f0d5b0145950b78a8ff29a2a -->
