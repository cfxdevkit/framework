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

```ts
export declare const __packageName: "@cfxdevkit/ui";
export interface AppShellProps {
export interface TopbarProps {
export interface MainGridProps {
export interface AssetConversionPanelProps {
export interface FieldProps {
export interface MetricProps {
export interface NetworkSwitchNoticeProps {
export interface NoticeProps {
export interface PanelProps {
export interface PanelBodyProps {
export interface SegmentedControlOption<TValue extends string = string> {
export interface SegmentedControlProps<TValue extends string = string> {
export interface StatusGridProps {
export interface TokenAmountFieldProps<TToken extends TokenSelectOption = TokenSelectOption> {
export interface TokenPairSelectorProps<TToken extends TokenSelectOption = TokenSelectOption> {
export interface TokenSelectOption {
export interface TokenSelectProps<TToken extends TokenSelectOption = TokenSelectOption> {
export interface WalletButtonProps {
export interface WalletPickerModalProps {
export interface WalletProviderCardProps {
export interface WalletStatusChipProps {
export declare function AppShell({ children }: AppShellProps): import("react/jsx-runtime").JSX.Element;
export declare function Topbar({ brand, actions }: TopbarProps): import("react/jsx-runtime").JSX.Element;
export declare function MainGrid({ sidebar, children }: MainGridProps): import("react/jsx-runtime").JSX.Element;
export declare function AssetConversionPanel({ amount, amountLabel, busy, className, error, fromAssetLabel, maxAmountLabel, mode, onAmountChange, onMax, onModeChange, onSubmit, submitLabel, success, title, toAssetLabel, wrapLabel, unwrapLabel, }: AssetConversionPanelProps): import("react/jsx-runtime").JSX.Element;
export declare function Field({ children, className, contentClassName, hint, label, labelClassName, required, }: FieldProps): import("react/jsx-runtime").JSX.Element;
export declare function IconButton({ title, children, ...props }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
export declare function Metric({ className, delta, deltaClassName, label, labelClassName, value, valueClassName, }: MetricProps): import("react/jsx-runtime").JSX.Element;
export declare function NetworkSwitchNotice({ addChainParams, buttonClassName, chainName, className, expectedChainId, message, preview, }: NetworkSwitchNoticeProps): import("react/jsx-runtime").JSX.Element | null;
export declare function Notice({ children, className, tone }: NoticeProps): import("react/jsx-runtime").JSX.Element;
export declare function Panel({ title, icon, actions, children }: PanelProps): import("react/jsx-runtime").JSX.Element;
export declare function PanelBody({ children }: PanelBodyProps): import("react/jsx-runtime").JSX.Element;
export declare function SegmentedControl<TValue extends string = string>({ activeOptionClassName, className, inactiveOptionClassName, onChange, optionClassName, options, value, }: SegmentedControlProps<TValue>): import("react/jsx-runtime").JSX.Element;
export declare function StatusGrid({ children, className, columns }: StatusGridProps): import("react/jsx-runtime").JSX.Element;
export declare function TokenAmountField<TToken extends TokenSelectOption = TokenSelectOption>({ amount, amountClassName, balance, className, label, onAmountChange, onTokenChange, tokens, tokenValue, }: TokenAmountFieldProps<TToken>): import("react/jsx-runtime").JSX.Element;
export declare function TokenPairSelector<TToken extends TokenSelectOption = TokenSelectOption>({ className, inputOptions, onSwap, onTokenInChange, onTokenOutChange, outputOptions, tokenInValue, tokenOutValue, }: TokenPairSelectorProps<TToken>): import("react/jsx-runtime").JSX.Element;
export declare function TokenSelect<TToken extends TokenSelectOption = TokenSelectOption>({ className, disabled, getOptionLabel, onChange, options, selectClassName, value, }: TokenSelectProps<TToken>): import("react/jsx-runtime").JSX.Element;
export declare function WalletButton({ className, connectLabel, connectedClassName, disconnectedClassName, disconnectLabel, }: WalletButtonProps): import("react/jsx-runtime").JSX.Element;
export declare function WalletPickerModal({ open, onClose, section }: WalletPickerModalProps): import("react/jsx-runtime").JSX.Element | null;
export declare function WalletProviderCard({ account, actions, chainLabel, className, connectLabel, connectPending, error, onConnect, onDisconnect, providerDescription, providerPresent, space, status, title, }: WalletProviderCardProps): import("react/jsx-runtime").JSX.Element;
export declare function WalletStatusChip({ address, className, status, }: WalletStatusChipProps): import("react/jsx-runtime").JSX.Element | null;
export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'className' | 'type'> & {
export type NoticeTone = 'neutral' | 'info' | 'ok' | 'success' | 'warning' | 'error';
export type WalletProviderCardStatus = 'active' | 'connecting' | 'detecting' | 'in-activating' | 'in-detecting' | 'not-active' | 'not-installed' | (string & {});
export type WalletStatusChipState = 'connected' | 'connecting' | 'disconnected';
```

---

## `./shell`

```ts
export interface AppShellProps {
export interface TopbarProps {
export interface MainGridProps {
export declare function AppShell({ children }: AppShellProps): import("react/jsx-runtime").JSX.Element;
export declare function Topbar({ brand, actions }: TopbarProps): import("react/jsx-runtime").JSX.Element;
export declare function MainGrid({ sidebar, children }: MainGridProps): import("react/jsx-runtime").JSX.Element;
```

---

## `./panel`

```ts
export interface PanelProps {
export interface PanelBodyProps {
export interface AssetConversionPanelProps {
export declare function Panel({ title, icon, actions, children }: PanelProps): import("react/jsx-runtime").JSX.Element;
export declare function PanelBody({ children }: PanelBodyProps): import("react/jsx-runtime").JSX.Element;
export declare function AssetConversionPanel({ amount, amountLabel, busy, className, error, fromAssetLabel, maxAmountLabel, mode, onAmountChange, onMax, onModeChange, onSubmit, submitLabel, success, title, toAssetLabel, wrapLabel, unwrapLabel, }: AssetConversionPanelProps): import("react/jsx-runtime").JSX.Element;
```

---

## `./form`

```ts
export interface FieldProps {
export interface TokenAmountFieldProps<TToken extends TokenSelectOption = TokenSelectOption> {
export interface TokenPairSelectorProps<TToken extends TokenSelectOption = TokenSelectOption> {
export interface TokenSelectOption {
export interface TokenSelectProps<TToken extends TokenSelectOption = TokenSelectOption> {
export declare function Field({ children, className, contentClassName, hint, label, labelClassName, required, }: FieldProps): import("react/jsx-runtime").JSX.Element;
export declare function TokenAmountField<TToken extends TokenSelectOption = TokenSelectOption>({ amount, amountClassName, balance, className, label, onAmountChange, onTokenChange, tokens, tokenValue, }: TokenAmountFieldProps<TToken>): import("react/jsx-runtime").JSX.Element;
export declare function TokenPairSelector<TToken extends TokenSelectOption = TokenSelectOption>({ className, inputOptions, onSwap, onTokenInChange, onTokenOutChange, outputOptions, tokenInValue, tokenOutValue, }: TokenPairSelectorProps<TToken>): import("react/jsx-runtime").JSX.Element;
export declare function TokenSelect<TToken extends TokenSelectOption = TokenSelectOption>({ className, disabled, getOptionLabel, onChange, options, selectClassName, value, }: TokenSelectProps<TToken>): import("react/jsx-runtime").JSX.Element;
```

---

## `./data-display`

```ts
export interface StatusGridProps {
export interface MetricProps {
export interface SegmentedControlOption<TValue extends string = string> {
export interface SegmentedControlProps<TValue extends string = string> {
export declare function StatusGrid({ children, className, columns }: StatusGridProps): import("react/jsx-runtime").JSX.Element;
export declare function Metric({ className, delta, deltaClassName, label, labelClassName, value, valueClassName, }: MetricProps): import("react/jsx-runtime").JSX.Element;
export declare function SegmentedControl<TValue extends string = string>({ activeOptionClassName, className, inactiveOptionClassName, onChange, optionClassName, options, value, }: SegmentedControlProps<TValue>): import("react/jsx-runtime").JSX.Element;
```

---

## `./feedback`

```ts
export type NoticeTone = 'neutral' | 'info' | 'ok' | 'success' | 'warning' | 'error';
export interface NoticeProps {
export interface NetworkSwitchNoticeProps {
export declare function Notice({ children, className, tone }: NoticeProps): import("react/jsx-runtime").JSX.Element;
export declare function NetworkSwitchNotice({ addChainParams, buttonClassName, chainName, className, expectedChainId, message, preview, }: NetworkSwitchNoticeProps): import("react/jsx-runtime").JSX.Element | null;
```

---

## `./wallet`

```ts
export interface WalletButtonProps {
export interface WalletPickerModalProps {
export interface WalletProviderCardProps {
export interface WalletStatusChipProps {
export declare function WalletButton({ className, connectLabel, connectedClassName, disconnectedClassName, disconnectLabel, }: WalletButtonProps): import("react/jsx-runtime").JSX.Element;
export declare function WalletPickerModal({ open, onClose, section }: WalletPickerModalProps): import("react/jsx-runtime").JSX.Element | null;
export declare function WalletProviderCard({ account, actions, chainLabel, className, connectLabel, connectPending, error, onConnect, onDisconnect, providerDescription, providerPresent, space, status, title, }: WalletProviderCardProps): import("react/jsx-runtime").JSX.Element;
export declare function WalletStatusChip({ address, className, status, }: WalletStatusChipProps): import("react/jsx-runtime").JSX.Element | null;
export declare function IconButton({ title, children, ...props }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
export type WalletProviderCardStatus = 'active' | 'connecting' | 'detecting' | 'in-activating' | 'in-detecting' | 'not-active' | 'not-installed' | (string & {});
export type WalletStatusChipState = 'connected' | 'connecting' | 'disconnected';
export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'className' | 'type'> & {
```

<!-- api-hash: 15239e34230bf227f87eaea6bbd085179218f7b3f0d5b0145950b78a8ff29a2a -->
