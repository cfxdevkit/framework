import type { SiweMessageInput } from './types.js';

export function createSiweMessage(input: SiweMessageInput): string {
  validateMessageInput(input);
  const lines = [
    `${input.domain} wants you to sign in with your Ethereum account:`,
    input.address,
    '',
  ];
  if (input.statement) lines.push(input.statement, '');
  lines.push(
    `URI: ${input.uri}`,
    `Version: ${input.version ?? '1'}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${formatDate(input.issuedAt ?? new Date())}`,
  );
  if (input.expirationTime) lines.push(`Expiration Time: ${formatDate(input.expirationTime)}`);
  if (input.notBefore) lines.push(`Not Before: ${formatDate(input.notBefore)}`);
  if (input.requestId) lines.push(`Request ID: ${input.requestId}`);
  if (input.resources?.length) {
    lines.push('Resources:', ...input.resources.map((resource) => `- ${resource}`));
  }
  return lines.join('\n');
}

function validateMessageInput(input: SiweMessageInput): void {
  if (!input.domain.trim()) throw new Error('SIWE domain is required');
  if (!input.uri.trim()) throw new Error('SIWE URI is required');
  if (!Number.isInteger(input.chainId) || input.chainId <= 0) {
    throw new Error('SIWE chainId must be a positive integer');
  }
  if (!/^[A-Za-z0-9]{8,}$/.test(input.nonce)) {
    throw new Error('SIWE nonce must be at least 8 alphanumeric characters');
  }
  if (input.statement?.includes('\n')) throw new Error('SIWE statement cannot contain newlines');
}

function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.valueOf())) throw new Error('SIWE date is invalid');
  return date.toISOString();
}
