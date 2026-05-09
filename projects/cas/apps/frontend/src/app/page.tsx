'use client';

import { WalletPickerModal } from '@cfxdevkit/wallet-connect/ui';
import { ArrowRight, ShieldCheck, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAuthContext } from './auth-context';

// biome-ignore lint/style/noDefaultExport: Next.js app router requires a default page export.
export default function HomePage() {
  const { isConnected } = useAccount();
  const { isLoading, login, token } = useAuthContext();
  const [walletOpen, setWalletOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    try {
      await login();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  return (
    <section className="hero-shell">
      <div className="hero-copy">
        <div className="hero-badge">
          <Zap size={16} />
          Non-custodial keeper automation
        </div>
        <h1>
          Automate your <span className="hero-accent">Conflux De-Fi</span>
        </h1>
        <p>
          Build limit orders and DCA strategies on Conflux eSpace. Your wallet signs every approval
          and strategy registration; CAS keeps execution and status tracking organized.
        </p>
        <div className="hero-actions">
          {!isConnected ? (
            <button
              className="button primary hero-button"
              type="button"
              onClick={() => setWalletOpen(true)}
            >
              <Wallet size={18} />
              Connect wallet
            </button>
          ) : token ? (
            <Link className="button primary hero-button" href="/dashboard">
              <ArrowRight size={18} />
              Open dashboard
            </Link>
          ) : (
            <button
              className="button primary hero-button"
              type="button"
              disabled={isLoading}
              onClick={signIn}
            >
              <ShieldCheck size={18} />
              {isLoading ? 'Signing...' : 'Sign in'}
            </button>
          )}
          <Link className="button hero-button" href="/status">
            View status
          </Link>
        </div>
        {error ? <div className="hero-error">{error}</div> : null}
      </div>

      <div className="hero-status">
        <div>
          <strong>Strategy types</strong>
          <span>Limit orders, DCA, and on-chain keeper registration</span>
        </div>
        <div>
          <strong>Wallet layer</strong>
          <span>wagmi v3 with the framework wallet picker</span>
        </div>
        <div>
          <strong>Runtime</strong>
          <span>SQLite-backed API, SSE job updates, pool metadata</span>
        </div>
      </div>

      <WalletPickerModal open={walletOpen} onClose={() => setWalletOpen(false)} section="espace" />
    </section>
  );
}
