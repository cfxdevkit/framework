import type { Address } from '@cfxdevkit/cdk';
import type { ParsedSiweMessage } from './types.js';

const HEADER = ' wants you to sign in with your Ethereum account:';

export function parseSiweMessage(message: string): ParsedSiweMessage {
  const lines = message.split('\n');
  const header = lines[0] ?? '';
  if (!header.endsWith(HEADER)) throw new Error('Invalid SIWE message header');
  const address = lines[1] as Address | undefined;
  if (!address) throw new Error('Invalid SIWE message address');
  let cursor = 2;
  if (lines[cursor] !== '') throw new Error('Invalid SIWE message spacing');
  cursor += 1;

  let statement: string | undefined;
  const maybeStatement = lines[cursor];
  if (maybeStatement !== undefined && !maybeStatement.startsWith('URI: ')) {
    statement = maybeStatement;
    cursor += 1;
    if (lines[cursor] !== '') throw new Error('Invalid SIWE message statement spacing');
    cursor += 1;
  }

  const fields = new Map<string, string>();
  const resources: string[] = [];
  for (; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line === undefined) throw new Error('Invalid SIWE field');
    if (line === 'Resources:') {
      for (let index = cursor + 1; index < lines.length; index += 1) {
        const resource = lines[index];
        if (resource === undefined) throw new Error('Invalid SIWE resource line');
        if (!resource.startsWith('- ')) throw new Error('Invalid SIWE resource line');
        resources.push(resource.slice(2));
      }
      break;
    }
    const separator = line.indexOf(': ');
    if (separator === -1) throw new Error(`Invalid SIWE field: ${line}`);
    fields.set(line.slice(0, separator), line.slice(separator + 2));
  }

  const version = requireField(fields, 'Version');
  if (version !== '1') throw new Error(`Unsupported SIWE version: ${version}`);
  const chainId = Number(requireField(fields, 'Chain ID'));
  if (!Number.isInteger(chainId) || chainId <= 0) throw new Error('Invalid SIWE chain id');

  const parsed: ParsedSiweMessage = {
    domain: header.slice(0, -HEADER.length),
    address,
    uri: requireField(fields, 'URI'),
    version,
    chainId,
    nonce: requireField(fields, 'Nonce'),
    issuedAt: requireField(fields, 'Issued At'),
    ...(statement ? { statement } : {}),
    resources,
  };
  const expirationTime = fields.get('Expiration Time');
  if (expirationTime !== undefined) parsed.expirationTime = expirationTime;
  const notBefore = fields.get('Not Before');
  if (notBefore !== undefined) parsed.notBefore = notBefore;
  const requestId = fields.get('Request ID');
  if (requestId !== undefined) parsed.requestId = requestId;
  return parsed;
}

function requireField(fields: Map<string, string>, name: string): string {
  const value = fields.get(name);
  if (!value) throw new Error(`Missing SIWE field: ${name}`);
  return value;
}
