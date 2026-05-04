export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function shortBase32(addr: string): string {
  const colon = addr.indexOf(':');
  if (colon !== -1) return `${addr.slice(0, colon + 1)}...${addr.slice(-6)}`;
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}
