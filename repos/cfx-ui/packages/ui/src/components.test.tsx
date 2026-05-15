import { describe, expect, it, vi } from 'vitest';

import { AssetConversionPanel } from './AssetConversionPanel.js';
import { SegmentedControl } from './SegmentedControl.js';
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

    const option = element.props.children.props.children[0];
    expect(option.props.children).toBe('WCFX · Wrapped CFX');
  });

  it('forwards changes to the provided callback', () => {
    const onChange = vi.fn();
    const element = TokenSelect({
      onChange,
      options: [{ address: '0x1', symbol: 'WCFX' }],
      value: '0x1',
    });

    element.props.children.props.onChange({ target: { value: '0x2' } });

    expect(onChange).toHaveBeenCalledWith('0x2');
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
