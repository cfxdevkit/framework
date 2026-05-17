'use client';

import { useEffect, useState } from 'react';
import type { NetworkId, SpaceId, WorkspaceSectionId } from './shared';
import {
  DEFAULT_SOURCE,
  readStoredEnum,
  readStoredString,
  STORAGE_PREFIX,
  workspaceSections,
  writeStoredString,
} from './shared';

export function useShowcaseWorkspaceDrafts() {
  const [activeSection, setActiveSection] = useState<WorkspaceSectionId>('keystore');
  const [network, setNetwork] = useState<NetworkId>('local');
  const [space, setSpace] = useState<SpaceId>('espace');
  const [mnemonicDraft, setMnemonicDraft] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [walletAccountCount, setWalletAccountCount] = useState('5');
  const [walletName, setWalletName] = useState('');
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [contractName, setContractName] = useState('Counter');
  const [solcVersion, setSolcVersion] = useState('0.8.26');
  const [storageReady, setStorageReady] = useState(false);
  const [mineCount, setMineCount] = useState('1');
  const [faucetAddress, setFaucetAddress] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('5');
  const [sessionContracts, setSessionContracts] = useState('');
  const [sessionSelectors, setSessionSelectors] = useState('0xa9059cbb');
  const [sessionMaxValue, setSessionMaxValue] = useState('0');
  const [sessionTtlMinutes, setSessionTtlMinutes] = useState('60');

  useEffect(() => {
    setActiveSection(readStoredEnum(`${STORAGE_PREFIX}.section`, 'keystore', workspaceSections()));
    setNetwork(
      readStoredEnum(`${STORAGE_PREFIX}.network`, 'local', [
        'local',
        'testnet',
        'mainnet',
      ] as const),
    );
    setSpace(readStoredEnum(`${STORAGE_PREFIX}.space`, 'espace', ['espace', 'core'] as const));
    setMnemonicDraft(readStoredDraft(`${STORAGE_PREFIX}.mnemonic`));
    setPassphrase(readStoredDraft(`${STORAGE_PREFIX}.passphrase`));
    setWalletAccountCount(readStoredString(`${STORAGE_PREFIX}.walletAccountCount`, '5'));
    setSource(readStoredString(`${STORAGE_PREFIX}.source`, DEFAULT_SOURCE));
    setContractName(readStoredString(`${STORAGE_PREFIX}.contractName`, 'Counter'));
    setSolcVersion(readStoredString(`${STORAGE_PREFIX}.solcVersion`, '0.8.26'));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.section`, activeSection);
  }, [activeSection, storageReady]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.network`, network);
  }, [network, storageReady]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.space`, space);
  }, [space, storageReady]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.mnemonic`, mnemonicDraft);
  }, [mnemonicDraft, storageReady]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.passphrase`, passphrase);
  }, [passphrase, storageReady]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.walletAccountCount`, walletAccountCount);
  }, [storageReady, walletAccountCount]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.source`, source);
  }, [source, storageReady]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.contractName`, contractName);
  }, [contractName, storageReady]);
  useEffect(() => {
    if (storageReady) writeStoredString(`${STORAGE_PREFIX}.solcVersion`, solcVersion);
  }, [solcVersion, storageReady]);

  return {
    activeSection,
    contractName,
    faucetAddress,
    faucetAmount,
    mineCount,
    mnemonicDraft,
    network,
    passphrase,
    sessionContracts,
    sessionMaxValue,
    sessionSelectors,
    sessionTtlMinutes,
    setWalletAccountCount,
    setActiveSection,
    setContractName,
    setFaucetAddress,
    setFaucetAmount,
    setMineCount,
    setMnemonicDraft,
    setNetwork,
    setPassphrase,
    setSessionContracts,
    setSessionMaxValue,
    setSessionSelectors,
    setSessionTtlMinutes,
    setSolcVersion,
    setSource,
    setSpace,
    setWalletName,
    solcVersion,
    source,
    space,
    storageReady,
    walletAccountCount,
    walletName,
  };
}

function readStoredDraft(key: string): string {
  const value = readStoredString(key, '');
  return value;
}

export type ShowcaseWorkspaceDrafts = ReturnType<typeof useShowcaseWorkspaceDrafts>;
