'use client';

import { WalletPickerModal } from '@cfxdevkit/wallet-connect/ui';
import { Activity, LayoutDashboard, LogOut, ShieldCheck, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi';
import { useAuthContext } from '../app/auth-context';

const TARGET_CHAIN_ID = readTargetChainId();

export function CasNavBar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { isAdmin, isLoading, login, logout, token } = useAuthContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const wrongChain = isConnected && chainId !== TARGET_CHAIN_ID;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { href: '/status', label: 'Status', icon: <Activity size={16} /> },
    ...(isAdmin ? [{ href: '/safety', label: 'Safety', icon: <ShieldCheck size={16} /> }] : []),
  ];

  const signIn = async () => {
    setAuthError(null);
    try {
      await login();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <header className="cas-nav">
      <Link href="/" className="cas-nav-logo" aria-label="Conflux Automation home">
        <span className="cas-nav-mark">
          <Zap size={17} />
        </span>
        <span>Conflux Automation</span>
      </Link>

      <nav className="cas-nav-links" aria-label="CAS navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'cas-nav-link active' : 'cas-nav-link'}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="cas-nav-actions">
        {authError ? <span className="cas-nav-error">{authError}</span> : null}
        {wrongChain ? (
          <button
            className="button"
            type="button"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
          >
            {isSwitching ? 'Switching...' : 'Switch network'}
          </button>
        ) : null}
        {!isConnected ? (
          <button className="button primary" type="button" onClick={() => setModalOpen(true)}>
            <Wallet size={17} />
            Connect
          </button>
        ) : token ? (
          <button
            className="button"
            type="button"
            onClick={() => {
              logout();
              disconnect();
            }}
          >
            <LogOut size={17} />
            {shortAddress(address)}
          </button>
        ) : (
          <button className="button primary" type="button" disabled={isLoading} onClick={signIn}>
            <ShieldCheck size={17} />
            {isLoading ? 'Signing...' : 'Sign in'}
          </button>
        )}
      </div>

      <WalletPickerModal open={modalOpen} onClose={() => setModalOpen(false)} section="espace" />
    </header>
  );
}

function shortAddress(address: string | undefined): string {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Signed in';
}

function readTargetChainId(): number {
  if (process.env.NEXT_PUBLIC_CAS_NETWORK === 'mainnet') return 1030;
  if (process.env.NEXT_PUBLIC_CAS_NETWORK === 'local') return 2030;
  return 71;
}
