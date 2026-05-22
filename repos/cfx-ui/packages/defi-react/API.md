# `@cfxdevkit/defi-react` — Public API

> Opinionated DeFi widgets (swap, portfolio, picker).

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 119 symbols |
| `./swap` | 6 symbols |
| `./balance` | 5 symbols |
| `./token-picker` | 2 symbols |
| `./tx-status` | 6 symbols |
| `./primitives` | 73 symbols |
| `./service` | 4 symbols |
| `./pool` | 10 symbols |
| `./lp` | 0 symbols |

---

## `.`

### Usage

```ts
import { SwapWidget } from '@cfxdevkit/defi-react';
```

```ts
// The package name
export declare const __packageName: "@cfxdevkit/defi-react";
// Props for the portfolio table component
export interface PortfolioTableProps {
// Input parameters for the usePortfolio hook
export interface UsePortfolioInput {
// Return type of the usePortfolio hook
export interface UsePortfolioReturn {
// Input parameters for the usePools hook
export interface UsePoolsInput {
// Return type of the usePools hook
export interface UsePoolsReturn {
// Input parameters for the usePoolTokens hook
export interface UsePoolTokensInput {
// Data structure for a liquidity pool
export interface PoolData {
// Return type of the usePoolTokens hook
export interface UsePoolTokensReturn {
// Input parameters for the useTokenPrice hook
export interface UseTokenPriceInput {
// Return type of the useTokenPrice hook
export interface UseTokenPriceReturn {
// Props for the Button component
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
// Props for the Card component
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
// Props for the Badge component
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
// Represents an item in a tab list
export interface TabItem<T extends string = string> {
// Props for the Tabs component
export interface TabsProps<T extends string = string> {
// Props for the NetworkBadge component
export interface NetworkBadgeProps {
// Result of a faucet request
export interface FaucetResult {
// Props for the FaucetWidget component
export interface FaucetWidgetProps {
// Props for the DevkitStatus component
export interface DevkitStatusProps {
// Structure of a toast notification
export interface Toast {
// Props for the AppToaster component
export interface AppToasterProps {
// Props for a selectable list item
export interface SelectableListItemProps {
// Props for the Input component
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
// Props for the CopyButton component
export interface CopyButtonProps {
// An option within a select menu
export interface SelectMenuOption<T extends string = string> {
// Props for the SelectMenu component
export interface SelectMenuProps<T extends string = string> {
// An option within a segmented control
export interface SegmentedControlOption<T extends string = string> {
// Props for the SegmentedControl component
export interface SegmentedControlProps<T extends string = string> {
export interface SectionHeaderProps {
// Props for the StatusBanner component
export interface StatusBannerProps {
// Props for the MetricCard component
export interface MetricCardProps {
// Properties for a navigation link
export interface NavLink {
// Props for the AppNavBar component
export interface AppNavBarProps {
// Props for the NavBrand component
export interface NavBrandProps {
// Props for the NavWalletActions component
export interface NavWalletActionsProps {
// Props for the MainGrid component
export interface MainGridProps {
// Props for the Panel component
export interface PanelProps {
// Props for the TradeTokenField component
export interface TradeTokenFieldProps {
// Props for the TradeActionBar component
export interface TradeActionBarProps {
// A single row in a trade summary
export interface TradeSummaryRow {
// Props for the TradeSummaryGrid component
export interface TradeSummaryGridProps {
// Props for the Notice component
export interface NoticeProps {
// The Button component
export declare function Button({ variant, size, loading, disabled, children, style, ...rest }: ButtonProps): import("react/jsx-runtime").JSX.Element;
// The Card component
export declare function Card({ padding, elevated, children, style, ...rest }: CardProps): import("react/jsx-runtime").JSX.Element;
// The Badge component
export declare function Badge({ variant, children, style, ...rest }: BadgeProps): import("react/jsx-runtime").JSX.Element;
// The Tabs component
export declare function Tabs<T extends string = string>({ items, active, onChange, style }: TabsProps<T>): import("react/jsx-runtime").JSX.Element;
// The NetworkBadge component
export declare function NetworkBadge({ chainId, name, style }: NetworkBadgeProps): import("react/jsx-runtime").JSX.Element;
// The FaucetWidget component
export declare function FaucetWidget({ onFund, defaultAddress, defaultAmountCfx, style, }: FaucetWidgetProps): import("react/jsx-runtime").JSX.Element;
// The DevkitStatus component
export declare function DevkitStatus({ nodeStatus, keystoreStatus, walletCount, blockNumber, onStartNode, onStopNode, style, }: DevkitStatusProps): import("react/jsx-runtime").JSX.Element;
// The AppToaster component
export declare function AppToaster({ toasts, onDismiss, position, style }: AppToasterProps): import("react/jsx-runtime").JSX.Element;
// The SelectableListItem component
export declare function SelectableListItem({ label, description, selected, disabled, icon, onClick, style, }: SelectableListItemProps): import("react/jsx-runtime").JSX.Element;
// The Input component
export declare function Input({ label, error, id, style, ...rest }: InputProps): import("react/jsx-runtime").JSX.Element;
// The CopyButton component
export declare function CopyButton({ text, label, style }: CopyButtonProps): import("react/jsx-runtime").JSX.Element;
// The SelectMenu component
export declare function SelectMenu<T extends string = string>({ options, value, onChange, label, disabled, style, }: SelectMenuProps<T>): import("react/jsx-runtime").JSX.Element;
// The SegmentedControl component
export declare function SegmentedControl<T extends string = string>({ options, active, onChange, style, }: SegmentedControlProps<T>): import("react/jsx-runtime").JSX.Element;
// The SectionHeader component
export declare function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps): import("react/jsx-runtime").JSX.Element;
// The StatusBanner component
export declare function StatusBanner({ variant, children, style }: StatusBannerProps): import("react/jsx-runtime").JSX.Element;
// The MetricCard component
export declare function MetricCard({ label, value, delta, style }: MetricCardProps): import("react/jsx-runtime").JSX.Element;
// The AppNavBar component
export declare function AppNavBar({ brand, links, actions, onLinkClick, style }: AppNavBarProps): import("react/jsx-runtime").JSX.Element;
// The NavBrand component
export declare function NavBrand({ icon, name, style }: NavBrandProps): import("react/jsx-runtime").JSX.Element;
// The NavWalletActions component
export declare function NavWalletActions({ isConnected, address, isSignedIn, isSigning, wrongNetwork, isSwitchingNetwork, error, onConnect, onSignIn, onSignOut, onSwitchNetwork, style, }: NavWalletActionsProps): import("react/jsx-runtime").JSX.Element;
// The AppShell component
export declare function AppShell({ children, style, ...props }: {
// The MainGrid component
export declare function MainGrid({ sidebar, children, style, ...props }: {
// The Panel component
export declare function Panel({ title, icon, actions, children, style }: PanelProps): import("react/jsx-runtime").JSX.Element;
// The PanelBody component
export declare function PanelBody({ children, style }: {
// The TradeTokenField component
export declare function TradeTokenField({ label, value, onChange, tokenSymbol, tokenIcon, onTokenClick, balance, disabled, placeholder, style, }: TradeTokenFieldProps): import("react/jsx-runtime").JSX.Element;
// The TradeActionBar component
export declare function TradeActionBar({ mode, onModeChange, slippage, onSlippageChange, style, }: TradeActionBarProps): import("react/jsx-runtime").JSX.Element;
// The TradeSummaryGrid component
export declare function TradeSummaryGrid({ rows, style }: TradeSummaryGridProps): import("react/jsx-runtime").JSX.Element | null;
// The Field component
export declare function Field({ label, children, style, }: {
// The Notice component
export declare function Notice({ tone, children, style }: NoticeProps): import("react/jsx-runtime").JSX.Element;
// The IconButton component
export declare function IconButton({ title, children, style, ...props }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
// The StatusGrid component
export declare function StatusGrid({ children, columns, style, }: {
// The Metric component
export declare function Metric({ label, value, style, }: {
// Creates a swap service
export declare function createSwapService(config: SwapServiceConfig): SwapService;
// Creates a Swappi adapter
export declare function createSwappiAdapter(config: {
// Creates a swap widget
export declare function createSwapWidget({ adapter, tokens, pairs, tokenSelectionOptions, defaultTokenIn, defaultTokenOut, onSwapSubmitted, }: SwapWidgetProps): import("react/jsx-runtime").JSX.Element;
// Hook for managing swap state
export declare function useSwap(input: UseSwapInput): UseSwapReturn;
// Props for the SwapWidget component
export interface SwapWidgetProps {
// Input parameters for the useSwap hook
export interface UseSwapInput {
// Return type of the useSwap hook
export interface UseSwapReturn {
```

---

## `./swap`

### Usage

```ts
import { SwapWidget } from '@cfxdevkit/defi-react/swap';
```

```ts
// Creates a Swappi adapter for integrating with external DEXs
export declare function createSwappiAdapter(config: {
// The SwapWidget component for performing token swaps
export declare function SwapWidget({ adapter, tokens, pairs, tokenSelectionOptions, defaultTokenIn, defaultTokenOut, onSwapSubmitted, }: SwapWidgetProps): import("react/jsx-runtime").JSX.Element;
// Hook for managing swap state and logic
export declare function useSwap(input: UseSwapInput): UseSwapReturn;
// Props for the SwapWidget component
export interface SwapWidgetProps {
// Input parameters for the useSwap hook
export interface UseSwapInput {
// Return type of the useSwap hook
export interface UseSwapReturn {
```

---

## `./balance`

### Usage

```ts
import { PortfolioTable } from '@cfxdevkit/defi-react/balance';
```

```ts
// Component to display token balances in a tabular format
export declare function PortfolioTable({ tokens, address, renderRow }: PortfolioTableProps): import("react/jsx-runtime").JSX.Element;
// Hook to fetch and manage portfolio data for a given address
export declare function usePortfolio(input: UsePortfolioInput): UsePortfolioReturn;
```

---

## `./token-picker`

### Usage

```ts
import { TokenPicker } from '@cfxdevkit/defi-react/token-picker';
```

```ts
// Component for selecting tokens from a registry with search and filtering
export declare function TokenPicker({ registry, chainId, selected, onSelect, placeholder, }: TokenPickerProps): import("react/jsx-runtime").JSX.Element;
```

---

## `./tx-status`

### Usage

```ts
import { TxStatusList } from '@cfxdevkit/defi-react/tx-status';
```

```ts
// Context provider for transaction status tracking
export declare function TxListProvider({ children }: {
// Hook to access transaction status context
export declare function useTxList(): TxListContextValue;
// Component to display recent transactions with status indicators
export declare function TxStatusList({ recent, onConfirm }: TxStatusListProps): import("react/jsx-runtime").JSX.Element | null;
// Toast component for real-time transaction updates
export declare function TxStatusToast({ hash, label, onConfirm }: TxStatusToastProps): import("react/jsx-runtime").JSX.Element;
// Props for the TxStatusList component
export interface TxStatusListProps {
// Props for the TxStatusToast component
export interface TxStatusToastProps {
```

---

## `./primitives`

### Usage

```ts
import { Button, Card } from '@cfxdevkit/defi-react/primitives';
```

```ts
// Button variant type
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
// Button size type
export type ButtonSize = 'sm' | 'md' | 'lg';
// Badge variant type
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
// Devkit node status type
export type DevkitNodeStatus = 'running' | 'stopped' | 'unknown';
// Devkit keystore status type
export type DevkitKeystoreStatus = 'locked' | 'unlocked' | 'not-setup' | 'unknown';
// Toast variant type
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
// Status banner variant type
export type StatusBannerVariant = 'info' | 'success' | 'warning' | 'error';
// Trade mode type
export type TradeMode = 'swap' | 'provide';
// Notice tone type
export type NoticeTone = 'neutral' | 'ok' | 'error' | 'warning';
// Props for the IconButton component
export interface IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type' | 'aria-label'> & {
// Props for the Button component
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
// Props for the Card component
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
// Props for the Badge component
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
// Represents an item in a tab list
export interface TabItem<T extends string = string> {
// Props for the Tabs component
export interface TabsProps<T extends string = string> {
// Props for the NetworkBadge component
export interface NetworkBadgeProps {
// Result of a faucet request
export interface FaucetResult {
// Props for the FaucetWidget component
export interface FaucetWidgetProps {
// Props for the DevkitStatus component
export interface DevkitStatusProps {
// Structure of a toast notification
export interface Toast {
// Props for the AppToaster component
export interface AppToasterProps {
// Props for a selectable list item
export interface SelectableListItemProps {
// Props for the Input component
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
// Props for the CopyButton component
export interface CopyButtonProps {
// An option within a select menu
export interface SelectMenuOption<T extends string = string> {
// Props for the SelectMenu component
export interface SelectMenuProps<T extends string = string> {
// An option within a segmented control
export interface SegmentedControlOption<T extends string = string> {
// Props for the SegmentedControl component
export interface SegmentedControlProps<T extends string = string> {
// Props for the SectionHeader component
export interface SectionHeaderProps {
// Props for the StatusBanner component
export interface StatusBannerProps {
// Props for the MetricCard component
export interface MetricCardProps {
// Properties for a navigation link
export interface NavLink {
// Props for the AppNavBar component
export interface AppNavBarProps {
// Props for the NavBrand component
export interface NavBrandProps {
// Props for the NavWalletActions component
export interface NavWalletActionsProps {
// Props for the MainGrid component
export interface MainGridProps {
// Props for the Panel component
export interface PanelProps {
// Props for the TradeTokenField component
export interface TradeTokenFieldProps {
// Props for the TradeActionBar component
export interface TradeActionBarProps {
// A single row in a trade summary
export interface TradeSummaryRow {
// Props for the TradeSummaryGrid component
export interface TradeSummaryGridProps {
// Props for the Notice component
export interface NoticeProps {
// The Button component
export declare function Button({ variant, size, loading, disabled, children, style, ...rest }: ButtonProps): import("react/jsx-runtime").JSX.Element;
// The Card component
export declare function Card({ padding, elevated, children, style, ...rest }: CardProps): import("react/jsx-runtime").JSX.Element;
// The Badge component
export declare function Badge({ variant, children, style, ...rest }: BadgeProps): import("react/jsx-runtime").JSX.Element;
// The Tabs component
export declare function Tabs<T extends string = string>({ items, active, onChange, style }: TabsProps<T>): import("react/jsx-runtime").JSX.Element;
// The NetworkBadge component
export declare function NetworkBadge({ chainId, name, style }: NetworkBadgeProps): import("react/jsx-runtime").JSX.Element;
// The FaucetWidget component
export declare function FaucetWidget({ onFund, defaultAddress, defaultAmountCfx, style, }: FaucetWidgetProps): import("react/jsx-runtime").JSX.Element;
// The DevkitStatus component
export declare function DevkitStatus({ nodeStatus, keystoreStatus, walletCount, blockNumber, onStartNode, onStopNode, style, }: DevkitStatusProps): import("react/jsx-runtime").JSX.Element;
// The AppToaster component
export declare function AppToaster({ toasts, onDismiss, position, style }: AppToasterProps): import("react/jsx-runtime").JSX.Element;
// The SelectableListItem component
export declare function SelectableListItem({ label, description, selected, disabled, icon, onClick, style, }: SelectableListItemProps): import("react/jsx-runtime").JSX.Element;
// The Input component
export declare function Input({ label, error, id, style, ...rest }: InputProps): import("react/jsx-runtime").JSX.Element;
// The CopyButton component
export declare function CopyButton({ text, label, style }: CopyButtonProps): import("react/jsx-runtime").JSX.Element;
// The SelectMenu component
export declare function SelectMenu<T extends string = string>({ options, value, onChange, label, disabled, style, }: SelectMenuProps<T>): import("react/jsx-runtime").JSX.Element;
// The SegmentedControl component
export declare function SegmentedControl<T extends string = string>({ options, active, onChange, style, }: SegmentedControlProps<T>): import("react/jsx-runtime").JSX.Element;
// The SectionHeader component
export declare function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps): import("react/jsx-runtime").JSX.Element;
// The StatusBanner component
export declare function StatusBanner({ variant, children, style }: StatusBannerProps): import("react/jsx-runtime").JSX.Element;
// The MetricCard component
export declare function MetricCard({ label, value, delta, style }: MetricCardProps): import("react/jsx-runtime").JSX.Element;
// The AppNavBar component
export declare function AppNavBar({ brand, links, actions, onLinkClick, style }: AppNavBarProps): import("react/jsx-runtime").JSX.Element;
// The NavBrand component
export declare function NavBrand({ icon, name, style }: NavBrandProps): import("react/jsx-runtime").JSX.Element;
// The NavWalletActions component
export declare function NavWalletActions({ isConnected, address, isSignedIn, isSigning, wrongNetwork, isSwitchingNetwork, error, onConnect, onSignIn, onSignOut, onSwitchNetwork, style, }: NavWalletActionsProps): import("react/jsx-runtime").JSX.Element;
// The AppShell component
export declare function AppShell({ children, style, ...props }: {
// The MainGrid component
export declare function MainGrid({ sidebar, children, style, ...props }: {
// The Panel component
export declare function Panel({ title, icon, actions, children, style }: PanelProps): import("react/jsx-runtime").JSX.Element;
// The PanelBody component
export declare function PanelBody({ children, style }: {
// The TradeTokenField component
export declare function TradeTokenField({ label, value, onChange, tokenSymbol, tokenIcon, onTokenClick, balance, disabled, placeholder, style, }: TradeTokenFieldProps): import("react/jsx-runtime").JSX.Element;
// The TradeActionBar component
export declare function TradeActionBar({ mode, onModeChange, slippage, onSlippageChange, style, }: TradeActionBarProps): import("react/jsx-runtime").JSX.Element;
// The TradeSummaryGrid component
export declare function TradeSummaryGrid({ rows, style }: TradeSummaryGridProps): import("react/jsx-runtime").JSX.Element | null;
// The Field component
export declare function Field({ label, children, style, }: {
// The Notice component
export declare function Notice({ tone, children, style }: NoticeProps): import("react/jsx-runtime").JSX.Element;
// The IconButton component
export declare function IconButton({ title, children, style, ...props }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
// The StatusGrid component
export declare function StatusGrid({ children, columns, style, }: {
// The Metric component
export declare function Metric({ label, value, style, }: {
```

<!-- api-hash: dcaf1465376a98b267bd1f4f0ef46bdad892d8522534af7c8b5d637641d979f0 -->
