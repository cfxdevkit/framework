import { describe, expect, it, vi } from 'vitest';

import { AssetConversionPanel } from './AssetConversionPanel.js';
import { Metric } from './Metric.js';
import { Notice } from './Notice.js';
import { SegmentedControl } from './SegmentedControl.js';
import { TokenPairSelector } from './TokenPairSelector.js';
import { TokenSelect } from './TokenSelect.js';
import { WalletProviderCard } from './WalletProviderCard.js';
import { WalletStatusChip } from './WalletStatusChip.js';

describe('WalletStatusChip', () => {
  it('returns null when no address is provided', () => {
    expect(WalletStatusChip({})).toBeNull();
  });

  it('truncates the address and applies the requested status tone', () => {
    const element = WalletStatusChip({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      status: 'connecting',
    }) as NonNullable<ReturnType<typeof WalletStatusChip>>;

    expect(element.props.className).toContain('border-amber-500/30');
    expect(element.props.children[1].props.children).toBe('0x1234…5678');
  });
});

describe('TokenSelect', () => {
  it('renders default option labels from symbol and name', () => {
    const element = TokenSelect({
      onChange: () => undefined,
      options: [{ address: '0x1', symbol: 'WCFX', name: 'Wrapped CFX' }],
      value: '0x1',
    });

    const details = element.props.children;
    const summary = details.props.children[0];
    const label = summary.props.children[0].props.children[1];

    expect(label.props.children).toBe('WCFX · Wrapped CFX');
  });

  it('renders token icons when logo URIs are provided', () => {
    const element = TokenSelect({
      onChange: () => undefined,
      options: [
        {
          address: '0x1',
          symbol: 'WCFX',
          name: 'Wrapped CFX',
          logoURI: 'https://example.com/wcfx.png',
        },
      ],
      value: '0x1',
    });

    const details = element.props.children;
    const summary = details.props.children[0];
    const icon = summary.props.children[0].props.children[0];

    expect(icon.props.token.logoURI).toBe('https://example.com/wcfx.png');
  });

  it('forwards token button clicks to the provided callback', () => {
    const onChange = vi.fn();
    const element = TokenSelect({
      onChange,
      options: [
        { address: '0x1', symbol: 'WCFX' },
        { address: '0x2', symbol: 'USDT' },
      ],
      value: '0x1',
    });

    const details = element.props.children;
    const menu = details.props.children[1];
    const option = menu.props.children[1];

    option.props.onClick({ currentTarget: { closest: () => null } });

    expect(onChange).toHaveBeenCalledWith('0x2');
  });
});

describe('TokenPairSelector', () => {
  it('inverts the pair when selecting the opposite token on the input side', () => {
    const onTokenInChange = vi.fn();
    const onTokenOutChange = vi.fn();
    const element = TokenPairSelector({
      inputOptions: [
        { address: '0x1', symbol: 'WCFX' },
        { address: '0x2', symbol: 'USDT' },
      ],
      onTokenInChange,
      onTokenOutChange,
      outputOptions: [
        { address: '0x1', symbol: 'WCFX' },
        { address: '0x2', symbol: 'USDT' },
      ],
      tokenInValue: '0x1',
      tokenOutValue: '0x2',
    });

    const firstSelect = element.props.children[0];
    firstSelect.props.onChange('0x2');

    expect(onTokenOutChange).toHaveBeenCalledWith('0x1');
    expect(onTokenInChange).toHaveBeenCalledWith('0x2');
  });

  it('swaps the current values when no custom swap handler is provided', () => {
    const onTokenInChange = vi.fn();
    const onTokenOutChange = vi.fn();
    const element = TokenPairSelector({
      inputOptions: [
        { address: '0x1', symbol: 'WCFX' },
        { address: '0x2', symbol: 'USDT' },
      ],
      onTokenInChange,
      onTokenOutChange,
      outputOptions: [
        { address: '0x1', symbol: 'WCFX' },
        { address: '0x2', symbol: 'USDT' },
      ],
      tokenInValue: '0x1',
      tokenOutValue: '0x2',
    });

    const swapButton = element.props.children[1];
    swapButton.props.onClick();

    expect(onTokenInChange).toHaveBeenCalledWith('0x2');
    expect(onTokenOutChange).toHaveBeenCalledWith('0x1');
  });
});

describe('WalletProviderCard', () => {
  it('renders a default connect button for ready providers', () => {
    const element = WalletProviderCard({
      onConnect: () => undefined,
      providerDescription: 'Injected provider',
      space: 'espace',
      status: 'not-active',
      title: 'MetaMask',
    }) as NonNullable<ReturnType<typeof WalletProviderCard>>;

    const children = element.props.children.filter(Boolean);
    const connectButton = children.find(
      (child: { type?: string } | null) => child?.type === 'button',
    );

    expect(connectButton?.props.children).toBe('Connect MetaMask');
  });
});

describe('AssetConversionPanel', () => {
  it('renders the success state when provided', () => {
    const element = AssetConversionPanel({
      amount: '1.25',
      fromAssetLabel: 'CFX',
      mode: 'wrap',
      onAmountChange: () => undefined,
      onModeChange: () => undefined,
      onSubmit: () => undefined,
      success: 'Wrapped successfully.',
      toAssetLabel: 'wCFX',
    }) as NonNullable<ReturnType<typeof AssetConversionPanel>>;

    const content = element.props.children[1].props.children.filter(Boolean);
    const successState = content.find(
      (child: { props?: { children?: string } } | null) =>
        child?.props?.children === 'Wrapped successfully.',
    );

    expect(successState?.props.children).toBe('Wrapped successfully.');
  });
});

describe('Notice', () => {
  it('applies the requested tone classes', () => {
    const element = Notice({ children: 'RPC mismatch', tone: 'error' }) as NonNullable<
      ReturnType<typeof Notice>
    >;

    expect(element.props.className).toContain('border-red-500/20');
    expect(element.props.role).toBe('alert');
  });
});

describe('Metric', () => {
  it('renders the delta with a positive accent', () => {
    const element = Metric({
      label: 'Portfolio value',
      value: '$12.4k',
      delta: '+4.2%',
    }) as NonNullable<ReturnType<typeof Metric>>;
    const children = element.props.children;
    const metricRow = children[1];
    const delta = metricRow.props.children[1];

    expect(delta.props.children).toBe('+4.2%');
    expect(delta.props.className).toContain('text-emerald-300');
  });
});

describe('SegmentedControl', () => {
  it('forwards the selected value when an option is clicked', () => {
    const onChange = vi.fn();
    const element = SegmentedControl({
      onChange,
      options: [
        { label: 'Mainnet', value: 'mainnet' },
        { label: 'Testnet', value: 'testnet' },
      ],
      value: 'testnet',
    }) as NonNullable<ReturnType<typeof SegmentedControl>>;

    const firstButton = element.props.children[0];
    firstButton.props.onClick();

    expect(onChange).toHaveBeenCalledWith('mainnet');
    expect(firstButton.props['aria-pressed']).toBe(false);
  });
});
