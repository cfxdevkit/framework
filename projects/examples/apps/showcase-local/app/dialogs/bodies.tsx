'use client';

import { SegmentedControl } from '@cfxdevkit/example-showcase-ui';
import {
  buttonRowStyle,
  DevnodeStat,
  errorStyle,
  inputStyle,
  labelStyle,
  stackStyle,
  statsGridStyle,
} from '../devnode/devnode-ui';
import type { ShowcaseWorkspaceCompose } from '../workspace/compose';
import type { ShowcaseWorkspaceDrafts } from '../workspace/drafts';
import type { SpaceId } from '../workspace/shared';
import { chainIdFor, displayNetwork } from '../workspace/shared';

export function WorkspaceFamilyControl({ drafts }: { drafts: ShowcaseWorkspaceDrafts }) {
  return (
    <div style={stackStyle}>
      <span style={labelStyle}>Target family</span>
      <SegmentedControl
        onChange={(value) => drafts.setSpace(value as SpaceId)}
        options={[
          { label: 'eSpace', value: 'espace' },
          { label: 'Core', value: 'core' },
        ]}
        value={drafts.space}
      />
    </div>
  );
}

export function CompilerDialogBody({
  compose,
  drafts,
  onClose,
}: {
  compose: ShowcaseWorkspaceCompose;
  drafts: ShowcaseWorkspaceDrafts;
  onClose(): void;
}) {
  return (
    <>
      {compose.compileError ? <div style={errorStyle}>{compose.compileError}</div> : null}
      <div style={statsGridStyle}>
        <label style={stackStyle}>
          <span style={labelStyle}>Contract name</span>
          <input
            type="text"
            style={inputStyle}
            value={drafts.contractName}
            onChange={(event) => drafts.setContractName(event.target.value)}
          />
        </label>
        <label style={stackStyle}>
          <span style={labelStyle}>solc version</span>
          <input
            type="text"
            style={inputStyle}
            value={drafts.solcVersion}
            onChange={(event) => drafts.setSolcVersion(event.target.value)}
          />
        </label>
      </div>
      <label style={stackStyle}>
        <span style={labelStyle}>Solidity source</span>
        <textarea
          rows={18}
          style={{ ...inputStyle, fontFamily: 'var(--cfx-font-mono)', resize: 'vertical' }}
          value={drafts.source}
          onChange={(event) => drafts.setSource(event.target.value)}
        />
      </label>
      <div style={buttonRowStyle}>
        <button
          type="button"
          disabled={compose.compileBusy}
          onClick={() => void compose.runCompile()}
        >
          {compose.compileBusy ? 'Compiling…' : 'Compile contract'}
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}

export function DeployDialogBody({
  activeWalletName,
  compose,
  drafts,
  onClose,
}: {
  activeWalletName: string | null;
  compose: ShowcaseWorkspaceCompose;
  drafts: ShowcaseWorkspaceDrafts;
  onClose(): void;
}) {
  return (
    <>
      <div style={statsGridStyle}>
        <DevnodeStat label="Network" value={displayNetwork(drafts.network)} />
        <DevnodeStat label="Active signer" value={activeWalletName ?? 'not ready'} />
        <DevnodeStat label="Artifact" value={compose.artifact?.contractName ?? 'not compiled'} />
      </div>
      <WorkspaceFamilyControl drafts={drafts} />
      {compose.deployError ? <div style={errorStyle}>{compose.deployError}</div> : null}
      <div style={buttonRowStyle}>
        <button
          type="button"
          disabled={compose.deployBusy}
          onClick={() => void compose.runDeploy()}
        >
          {compose.deployBusy ? 'Deploying…' : 'Deploy contract'}
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}

export function SessionKeyDialogBody({
  activeWalletName,
  compose,
  drafts,
  onClose,
}: {
  activeWalletName: string | null;
  compose: ShowcaseWorkspaceCompose;
  drafts: ShowcaseWorkspaceDrafts;
  onClose(): void;
}) {
  return (
    <>
      <div style={statsGridStyle}>
        <DevnodeStat
          label="Scoped chain"
          value={String(chainIdFor(drafts.network, drafts.space))}
        />
        <DevnodeStat label="Parent signer" value={activeWalletName ?? 'not ready'} />
      </div>
      <WorkspaceFamilyControl drafts={drafts} />
      <label style={stackStyle}>
        <span style={labelStyle}>Allowed contracts</span>
        <textarea
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="0xabc..., 0xdef..."
          value={drafts.sessionContracts}
          onChange={(event) => drafts.setSessionContracts(event.target.value)}
        />
      </label>
      <label style={stackStyle}>
        <span style={labelStyle}>Allowed selectors</span>
        <textarea
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="0x12345678, 0xabcdef12..."
          value={drafts.sessionSelectors}
          onChange={(event) => drafts.setSessionSelectors(event.target.value)}
        />
      </label>
      <div style={statsGridStyle}>
        <label style={stackStyle}>
          <span style={labelStyle}>Max CFX value</span>
          <input
            type="text"
            style={inputStyle}
            value={drafts.sessionMaxValue}
            onChange={(event) => drafts.setSessionMaxValue(event.target.value)}
          />
        </label>
        <label style={stackStyle}>
          <span style={labelStyle}>TTL (minutes)</span>
          <input
            type="text"
            style={inputStyle}
            value={drafts.sessionTtlMinutes}
            onChange={(event) => drafts.setSessionTtlMinutes(event.target.value)}
          />
        </label>
      </div>
      {compose.sessionError ? <div style={errorStyle}>{compose.sessionError}</div> : null}
      <div style={buttonRowStyle}>
        <button
          type="button"
          disabled={compose.sessionBusy !== 'idle'}
          onClick={() => void compose.runIssueSession()}
        >
          {compose.sessionBusy !== 'idle' ? 'Issuing…' : 'Issue session key'}
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}

export function CustomOperationDialogBody({
  compose,
  drafts,
  onClose,
}: {
  compose: ShowcaseWorkspaceCompose;
  drafts: ShowcaseWorkspaceDrafts;
  onClose(): void;
}) {
  return (
    <>
      <WorkspaceFamilyControl drafts={drafts} />
      <div style={buttonRowStyle}>
        <button
          type="button"
          disabled={compose.customBlockBusy}
          onClick={() => void compose.runReadBlockNumber()}
        >
          {compose.customBlockBusy ? 'Reading head…' : 'Read block number'}
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}
