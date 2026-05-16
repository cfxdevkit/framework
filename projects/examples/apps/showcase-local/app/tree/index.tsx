'use client';

import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { useMemo } from 'react';
import type { ShowcaseContractRecord } from '../../lib/contracts-types';
import type {
  KeystoreActiveWalletSummary,
  KeystoreWalletAccountSummary,
  KeystoreWalletSummary,
} from '../../lib/keystore-types';
import type { NetworkId, SpaceId, WorkspaceSectionId } from '../workspace/shared';
import { buildTreeModel, handleNodeAction, resolveActiveNodeId } from './model';

export type { NetworkId, SpaceId, WorkspaceSectionId } from '../workspace/shared';

export interface WorkspaceTreeProps {
  accountsBusy: 'refresh' | 'activate' | null;
  activeSection: WorkspaceSectionId;
  activeWallet: KeystoreActiveWalletSummary | null;
  contracts: readonly ShowcaseContractRecord[];
  devnodeRunning: boolean;
  keystoreReady: boolean;
  localWriteBlocked: boolean;
  network: NetworkId;
  selectedContractId: string | null;
  selectedContractFunctions: readonly string[];
  selectedNodeProfileName: string | null;
  space: SpaceId;
  walletAccounts: readonly KeystoreWalletAccountSummary[];
  wallets: readonly KeystoreWalletSummary[];
  onSelectContract(id: string): void;
  onSelectSection(section: WorkspaceSectionId): void;
  onSetSpace(space: SpaceId): void;
}

export interface TreeNodeData {
  id: string;
  label: string;
  meta?: string;
  section?: WorkspaceSectionId;
  action?:
    | { type: 'space'; space: SpaceId }
    | { type: 'section'; section: WorkspaceSectionId }
    | { type: 'contract'; contractId: string };
}

const treeWrapStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-2)',
  padding: 'var(--cfx-space-1) 0',
} as const;

const treeContainerStyle = {
  display: 'grid',
  gap: '0',
} as const;

const rowOuterStyle = {
  alignItems: 'center',
  display: 'flex',
  minHeight: '22px',
  paddingRight: '8px',
} as const;

const toggleStyle = {
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  color: 'var(--cfx-color-fg-subtle)',
  cursor: 'pointer',
  display: 'flex',
  fontFamily: 'var(--cfx-font-mono)',
  fontSize: '10px',
  height: '22px',
  justifyContent: 'center',
  padding: 0,
  width: '20px',
  flexShrink: 0,
} as const;

const itemLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0,
  flex: 1,
} as const;

export function WorkspaceTree(props: WorkspaceTreeProps) {
  const treeModel = useMemo(() => buildTreeModel(props), [props]);

  const tree = useTree<TreeNodeData>({
    rootItemId: 'root',
    indent: 14,
    initialState: { expandedItems: treeModel.expandedItems },
    getItemName: (item) => item.getItemData().label,
    isItemFolder: (item) => (treeModel.childrenById.get(item.getId())?.length ?? 0) > 0,
    onPrimaryAction: (item) => handleNodeAction(item.getItemData(), props),
    dataLoader: {
      getItem: (itemId) => treeModel.nodesById.get(itemId) ?? { id: 'root', label: 'root' },
      getChildren: (itemId) => treeModel.childrenById.get(itemId) ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  const activeNodeId = useMemo(() => resolveActiveNodeId(props), [props]);

  return (
    <div style={treeWrapStyle}>
      <div {...tree.getContainerProps('Conflux workspace tree')} style={treeContainerStyle}>
        {tree.getItems().map((item) => {
          const itemProps = item.getProps();
          const data = item.getItemData();
          const active = data.id === activeNodeId;
          const level = item.getItemMeta().level;
          const isFolder = item.isFolder();
          const isExpanded = item.isExpanded();
          const handleActivate = () => {
            handleNodeAction(data, props);
            if (isFolder) {
              if (isExpanded) item.collapse();
              else item.expand();
            }
          };

          return (
            <button
              type="button"
              key={item.getId()}
              style={{
                ...rowOuterStyle,
                border: 'none',
                display: 'flex',
                paddingLeft: `${Math.max(0, level * 14)}px`,
                background: active ? '#37373d' : 'transparent',
                color: active ? '#ffffff' : '#cccccc',
                cursor: 'pointer',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#2a2d2e';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
              {...itemProps}
              onClick={(event) => {
                itemProps.onClick?.(event);
                handleActivate();
              }}
              onKeyDown={(event) => {
                itemProps.onKeyDown?.(event);
                if (event.defaultPrevented) {
                  return;
                }
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleActivate();
                }
              }}
            >
              {isFolder ? (
                <span aria-hidden="true" style={toggleStyle}>
                  <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="currentColor"
                    aria-hidden="true"
                    style={{
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.1s',
                    }}
                  >
                    <path d="M5.5 3L11 8l-5.5 5v-10z" />
                  </svg>
                </span>
              ) : (
                <span aria-hidden="true" style={toggleStyle}></span>
              )}
              <div style={itemLabelStyle}>
                {isFolder ? (
                  <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="currentColor"
                    opacity="0.8"
                    aria-hidden="true"
                  >
                    {isExpanded ? (
                      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zm1.5-.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5H9c-.52 0-1.015-.352-1.425-.816C7.16 3.56 6.542 3 5.264 3H2.5zM2 6h12v7H2V6z" />
                    ) : (
                      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zm1.5-.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5H9c-.52 0-1.015-.352-1.425-.816C7.16 3.56 6.542 3 5.264 3H2.5z" />
                    )}
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="currentColor"
                    opacity="0.6"
                    aria-hidden="true"
                  >
                    <path d="M13.71 4.29l-3-3L10 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5l-.29-.71zM10 2.41L12.59 5H10V2.41zM3 14V2h6v4h4v8H3z" />
                  </svg>
                )}
                <span
                  style={{
                    fontSize: '13px',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {data.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
