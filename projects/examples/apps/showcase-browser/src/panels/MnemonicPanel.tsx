import { generateMnemonic, validateMnemonic } from '@cfxdevkit/core';
import { useMemo, useState } from 'react';
import { CopyButton } from '../components/CopyButton.js';

type Strength = 128 | 160 | 192 | 224 | 256;

export function MnemonicPanel() {
  const [strength, setStrength] = useState<Strength>(128);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [check, setCheck] = useState<string>('');

  const wordCount = useMemo(() => (mnemonic ? mnemonic.trim().split(/\s+/).length : 0), [mnemonic]);

  return (
    <>
      <section className="panel">
        <h2>Generate BIP-39 mnemonic</h2>
        <p className="panel-desc">
          Calls <code className="mono">generateMnemonic(strength)</code> from{' '}
          <code className="mono">@cfxdevkit/core</code>. Entropy comes from the platform CSPRNG via{' '}
          <code className="mono">@scure/bip39</code>.
        </p>
        <div className="row">
          <label>
            Strength
            <select
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value) as Strength)}
            >
              <option value={128}>128 bits → 12 words</option>
              <option value={160}>160 bits → 15 words</option>
              <option value={192}>192 bits → 18 words</option>
              <option value={224}>224 bits → 21 words</option>
              <option value={256}>256 bits → 24 words</option>
            </select>
          </label>
          <button
            type="button"
            className="primary"
            onClick={() => setMnemonic(generateMnemonic(strength))}
          >
            Generate
          </button>
          {mnemonic && <CopyButton text={mnemonic} />}
        </div>
        {mnemonic && (
          <div className="result">
            <div style={{ marginBottom: 8, color: 'var(--accent-2)' }}>
              ✓ {wordCount} words · valid
            </div>
            {mnemonic}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Validate a mnemonic</h2>
        <p className="panel-desc">
          Calls <code className="mono">validateMnemonic(phrase)</code>. Returns true only when the
          phrase round-trips against the English wordlist with a valid checksum.
        </p>
        <textarea
          placeholder="paste a phrase to validate"
          value={check}
          onChange={(e) => setCheck(e.target.value)}
        />
        {check.trim() && (
          <div className="result">
            {validateMnemonic(check) ? (
              <span style={{ color: 'var(--accent-2)' }}>✓ valid BIP-39 mnemonic</span>
            ) : (
              <span style={{ color: 'var(--err)' }}>✗ invalid mnemonic</span>
            )}
          </div>
        )}
      </section>
    </>
  );
}
