'use client';

import { CopyButton, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import {
  buttonRowStyle,
  DevnodeStat,
  errorStyle,
  inputStyle,
  labelStyle,
  noteStyle,
  rowStyle,
  stackStyle,
  statsGridStyle,
} from '../devnode/devnode-ui';
import { type ShowcaseWorkspacePanelsProps, sectionStyle } from './shared';

export function DevnodePanel(props: ShowcaseWorkspacePanelsProps) {
  if (props.network !== 'local') {
    return null;
  }

  return (
    <section
      id="devnode"
      style={props.activeSection === 'devnode' ? sectionStyle : { display: 'none' }}
    >
      <div style={{ padding: '24px', backgroundColor: '#1e1e1e' }}>
        <div
          style={{
            paddingBottom: '16px',
            borderBottom: '1px solid #3c3c3c',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              margin: 0,
              fontWeight: 500,
              color: '#e7e7e7',
              marginBottom: '8px',
            }}
          >
            Local Devnode
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            The local node is another consumer of the stored mnemonic roots. Select the node profile
            from the keystore-backed list, then start or restart the devnode without sending raw
            mnemonic text through the client.
          </p>
        </div>
        <div style={stackStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>Status</span>
            {props.devnodeBadge}
          </div>
          <div style={statsGridStyle}>
            <DevnodeStat
              label="Block"
              value={props.devnode?.blockNumber != null ? String(props.devnode.blockNumber) : 'n/a'}
            />
            <DevnodeStat
              label="Node profile"
              value={props.selectedNodeProfile?.name ?? 'not selected'}
            />
            <DevnodeStat
              label="eSpace RPC"
              mono
              value={props.devnode?.urls?.espace ?? 'not running'}
            />
            <DevnodeStat label="Core RPC" mono value={props.devnode?.urls?.core ?? 'not running'} />
          </div>
          <div style={statsGridStyle}>
            <DevnodeStat
              label="Data dir"
              mono
              value={props.selectedNodeProfile?.dataDir ?? 'select a mnemonic below'}
            />
            <DevnodeStat
              label="Profile state"
              value={props.nodeProfileLocked ? 'locked while running' : 'selectable'}
            />
          </div>

          {props.devnodeError ? <div style={errorStyle}>{props.devnodeError}</div> : null}
          {props.nodeProfileError ? <div style={errorStyle}>{props.nodeProfileError}</div> : null}

          {props.nodeProfiles.length > 0 ? (
            <div style={stackStyle}>
              {props.nodeProfiles.map((profile) => (
                <div
                  key={profile.id}
                  style={{
                    border: '1px solid var(--cfx-color-border-default)',
                    borderRadius: 'var(--cfx-radius-md)',
                    display: 'grid',
                    gap: 'var(--cfx-space-2)',
                    padding: 'var(--cfx-space-3)',
                  }}
                >
                  <div style={rowStyle}>
                    <strong>{profile.name}</strong>
                    <div
                      style={{ alignItems: 'center', display: 'flex', gap: 'var(--cfx-space-2)' }}
                    >
                      {profile.selected ? <StatusBadge label="selected" status="ok" /> : null}
                    </div>
                  </div>
                  <div style={noteStyle}>
                    Data dir: <code>{profile.dataDir}</code>
                  </div>
                  {profile.firstAddress ? (
                    <div style={noteStyle}>
                      First address: <code>{profile.firstAddress}</code>
                    </div>
                  ) : null}
                  <div style={buttonRowStyle}>
                    <button
                      type="button"
                      disabled={
                        props.nodeProfileBusy !== null ||
                        profile.selected ||
                        props.nodeProfileLocked
                      }
                      onClick={() => {
                        const wallet = props.wallets.find((entry) => entry.id === profile.id);
                        if (wallet) props.onSelectNodeProfile(wallet);
                      }}
                    >
                      {props.nodeProfileBusy === 'select' &&
                      props.nodeProfileActionId === profile.id
                        ? 'Selecting…'
                        : 'Use for node'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={noteStyle}>
              Generate or import a mnemonic in the keystore first. The local node profile is
              selected from that list and locked while the node is running.
            </div>
          )}

          <div style={buttonRowStyle}>
            <button
              type="button"
              disabled={
                props.devnodeBusy !== null ||
                props.devnode?.running ||
                !props.selectedNodeProfile ||
                !props.keystoreReady
              }
              onClick={props.onStartDevnode}
            >
              {props.devnodeBusy === 'start' ? 'Starting…' : 'Start node'}
            </button>
            <button
              type="button"
              disabled={props.devnodeBusy !== null || !props.devnode?.running}
              onClick={props.onRestartDevnode}
            >
              {props.devnodeBusy === 'restart' ? 'Restarting…' : 'Restart node'}
            </button>
            <button
              type="button"
              disabled={props.devnodeBusy !== null || !props.devnode?.running}
              onClick={props.onStopDevnode}
            >
              {props.devnodeBusy === 'stop' ? 'Stopping…' : 'Stop node'}
            </button>
            <button
              type="button"
              disabled={props.devnodeBusy !== null}
              onClick={props.onWipeDevnode}
            >
              {props.devnodeBusy === 'wipe' ? 'Wiping…' : 'Wipe node data'}
            </button>
            <button
              type="button"
              disabled={props.devnodeBusy !== null}
              onClick={props.onRefreshDevnode}
            >
              {props.devnodeBusy === 'refresh' ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div style={buttonRowStyle}>
            <input
              type="number"
              min="1"
              max="100"
              style={{ ...inputStyle, width: 120 }}
              value={props.mineCount}
              onChange={(event) => props.onSetMineCount(event.target.value)}
            />
            <button
              type="button"
              disabled={props.devnodeBusy !== null || !props.devnode?.running}
              onClick={props.onMineBlocks}
            >
              {props.devnodeBusy === 'mine' ? 'Mining…' : 'Mine blocks'}
            </button>
          </div>

          <div style={noteStyle}>
            Starting the local node now uses the selected backend node profile and its deterministic
            data directory. Current RPC for the selected space:{' '}
            <code>{props.localRpc ?? 'not running'}</code>
          </div>
          <div style={noteStyle}>
            Wipe removes the active local node data directory through the backend before the next
            start or restart.
          </div>

          {props.devnodeAccounts.length > 0 ? (
            <div style={statsGridStyle}>
              {props.devnodeAccounts.map((account) => (
                <div
                  key={`${account.index}:${account.evmAddress}`}
                  style={{
                    border: '1px solid var(--cfx-color-border-default)',
                    borderRadius: 'var(--cfx-radius-md)',
                    display: 'grid',
                    gap: 'var(--cfx-space-2)',
                    padding: 'var(--cfx-space-3)',
                  }}
                >
                  <div style={rowStyle}>
                    <strong>Genesis #{account.index}</strong>
                    <span style={labelStyle}>{account.initialBalanceCfx} CFX</span>
                  </div>
                  <div style={noteStyle}>
                    eSpace: <code>{account.evmAddress}</code>
                  </div>
                  <div style={noteStyle}>
                    Core: <code>{account.coreAddress}</code>
                  </div>
                  <div style={buttonRowStyle}>
                    <CopyButton label="copy eSpace" text={account.evmAddress} />
                    <CopyButton label="copy Core" text={account.coreAddress} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={noteStyle}>
              Start the local node to expose the funded genesis accounts for the selected mnemonic
              profile.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
