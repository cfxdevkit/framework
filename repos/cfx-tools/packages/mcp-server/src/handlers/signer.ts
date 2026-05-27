import { readSignerConfig, type SignerEntry, writeSignerConfig } from '@cfxdevkit/signer-session';

function text(content: string) {
  return { content: [{ type: 'text' as const, text: content }] };
}
function errText(content: string) {
  return { isError: true as const, content: [{ type: 'text' as const, text: content }] };
}

export async function handleSignerTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ isError?: true; content: Array<{ type: 'text'; text: string }> }> {
  switch (name) {
    case 'cfxdevkit_signer_status': {
      try {
        const config = await readSignerConfig();
        const activeName = process.env.CFX_SIGNER_NAME ?? config.defaultSigner;
        const entry = config.signers[activeName];
        if (!entry) {
          return text(
            JSON.stringify(
              {
                activeSigner: activeName,
                status: 'not found',
                configuredSigners: Object.keys(config.signers),
                hint: 'Run cfxdevkit_signer_setup to configure a signer.',
              },
              null,
              2,
            ),
          );
        }

        let espaceAddress: string | null = null;
        if (entry.kind === 'file-keystore' && process.env.CFX_PASSPHRASE) {
          try {
            const { createSignerSession } = await import('@cfxdevkit/signer-session');
            const session = await createSignerSession({ ...entry, kind: 'file-keystore' });
            espaceAddress = session.eSpace.account.address;
            await session.dispose();
          } catch {
            /* passphrase incorrect or keystore missing */
          }
        }

        return text(
          JSON.stringify(
            {
              activeSigner: activeName,
              kind: entry.kind,
              config: { ...entry, kind: undefined },
              ...(espaceAddress ? { espaceAddress } : {}),
              allSigners: Object.keys(config.signers),
              note:
                entry.kind === 'memory'
                  ? '⚠ Ephemeral — fresh key each session.'
                  : entry.kind === 'onekey' || entry.kind === 'ledger'
                    ? 'Hardware signer — device must be connected to derive addresses.'
                    : undefined,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errText(
          `Failed to read signer config: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    case 'cfxdevkit_signer_setup': {
      const signerName = String(args.name ?? '');
      const kind = String(args.kind ?? '') as SignerEntry['kind'];

      if (!signerName) return errText('name is required.');
      if (!['memory', 'file-keystore', 'onekey', 'ledger'].includes(kind)) {
        return errText(`kind must be one of: memory, file-keystore, onekey, ledger. Got: ${kind}`);
      }

      let entry: SignerEntry;
      if (kind === 'file-keystore') {
        entry = {
          kind: 'file-keystore',
          ...(args.path ? { path: String(args.path) } : {}),
          ...(args.service ? { service: String(args.service) } : {}),
          ...(args.account ? { account: String(args.account) } : {}),
          ...(args.accountIndex !== undefined ? { accountIndex: Number(args.accountIndex) } : {}),
        };
      } else if (kind === 'onekey') {
        const idx = Number(args.accountIndex ?? 0);
        entry = {
          kind: 'onekey',
          espacePath: `m/44'/60'/0'/0/${idx}`,
          corePath: `m/44'/503'/0'/0/${idx}`,
        };
      } else if (kind === 'ledger') {
        entry = { kind: 'ledger' };
      } else {
        entry = { kind: 'memory' };
      }

      try {
        const existing = await readSignerConfig();
        const setAsDefault = args.setAsDefault !== false; // default true
        const updated = {
          defaultSigner: setAsDefault ? signerName : existing.defaultSigner,
          signers: { ...existing.signers, [signerName]: entry },
        };
        await writeSignerConfig(updated);

        // Verify file-keystore if passphrase is available
        let verifiedAddress: string | null = null;
        if (kind === 'file-keystore' && process.env.CFX_PASSPHRASE) {
          try {
            const { createSignerSession } = await import('@cfxdevkit/signer-session');
            const session = await createSignerSession({ ...entry, kind: 'file-keystore' });
            verifiedAddress = session.eSpace.account.address;
            await session.dispose();
          } catch (err) {
            return text(
              JSON.stringify(
                {
                  status: 'configured-unverified',
                  name: signerName,
                  kind,
                  warning: `Could not verify signer (${err instanceof Error ? err.message : String(err)})`,
                },
                null,
                2,
              ),
            );
          }
        }

        return text(
          JSON.stringify(
            {
              status: 'configured',
              name: signerName,
              kind,
              isDefault: setAsDefault,
              ...(verifiedAddress ? { espaceAddress: verifiedAddress } : {}),
              note:
                kind === 'memory'
                  ? '⚠ Ephemeral signer — set as default for quick testing.'
                  : 'Run cfxdevkit_signer_status to verify.',
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errText(
          `Failed to write signer config: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    case 'cfxdevkit_signer_use': {
      const signerName = String(args.name ?? '');
      if (!signerName) return errText('name is required.');
      try {
        const config = await readSignerConfig();
        if (!config.signers[signerName]) {
          return errText(
            `Signer '${signerName}' not found. Available: ${Object.keys(config.signers).join(', ')}`,
          );
        }
        await writeSignerConfig({ ...config, defaultSigner: signerName });
        return text(
          `✓ Active signer switched to '${signerName}' (${config.signers[signerName].kind})`,
        );
      } catch (err) {
        return errText(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    default:
      return errText(`Unknown signer tool: ${name}`);
  }
}
