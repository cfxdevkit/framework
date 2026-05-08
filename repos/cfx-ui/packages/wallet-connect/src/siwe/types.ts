import type { Address, Hex } from '@cfxdevkit/core';

export interface SiweMessageInput {
  domain: string;
  address: Address;
  uri: string;
  version?: '1';
  chainId: number;
  nonce: string;
  issuedAt?: Date | string;
  expirationTime?: Date | string;
  notBefore?: Date | string;
  requestId?: string;
  statement?: string;
  resources?: readonly string[];
}

export interface ParsedSiweMessage {
  domain: string;
  address: Address;
  uri: string;
  version: '1';
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  statement?: string;
  resources: readonly string[];
}

export interface VerifySiweMessageInput {
  message: string;
  signature: Hex;
  expectedDomain?: string;
  expectedNonce?: string;
  expectedAddress?: Address;
  expectedChainId?: number;
  now?: Date;
}

export interface VerifySiweMessageResult {
  ok: boolean;
  address?: Address;
  message?: ParsedSiweMessage;
  error?: string;
}
