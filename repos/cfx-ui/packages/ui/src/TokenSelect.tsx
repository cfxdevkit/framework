export interface TokenSelectOption {
  address: string;
  logoURI?: string;
  name?: string;
  symbol: string;
}

export interface TokenSelectProps<TToken extends TokenSelectOption = TokenSelectOption> {
  className?: string;
  disabled?: boolean;
  getOptionLabel?: (token: TToken) => string;
  onChange: (address: string) => void;
  options: readonly TToken[];
  selectClassName?: string;
  value: string;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

function sameAddress(left: string | undefined, right: string | undefined): boolean {
  return left?.toLowerCase() === right?.toLowerCase();
}

function defaultOptionLabel(token: TokenSelectOption): string {
  return `${token.symbol}${token.name ? ` · ${token.name}` : ''}`;
}

function initialsForToken(token: TokenSelectOption | undefined): string {
  const fallback = token?.symbol ?? '?';
  return fallback.slice(0, 2).toUpperCase();
}

function TokenIcon({ token }: { token: TokenSelectOption | undefined }) {
  if (token?.logoURI) {
    return (
      <img
        src={token.logoURI}
        alt={token.symbol}
        className="h-7 w-7 rounded-full border border-slate-700/80 bg-slate-950 object-cover"
      />
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
      {initialsForToken(token)}
    </span>
  );
}

export function TokenSelect<TToken extends TokenSelectOption = TokenSelectOption>({
  className,
  disabled,
  getOptionLabel,
  onChange,
  options,
  selectClassName,
  value,
}: TokenSelectProps<TToken>) {
  const selectedToken = options.find((token) => sameAddress(token.address, value)) ?? options[0];
  const selectedLabel = selectedToken
    ? (getOptionLabel?.(selectedToken) ?? defaultOptionLabel(selectedToken))
    : 'Select token';

  if (disabled) {
    return (
      <div className={className}>
        <div
          className={joinClasses(
            'flex w-full items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 opacity-70',
            selectClassName,
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <TokenIcon token={selectedToken} />
            <span className="truncate">{selectedLabel}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={joinClasses('relative', className)}>
      <details className="group">
        <summary
          className={joinClasses(
            'flex w-full list-none items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-left text-sm text-slate-100 outline-none transition-colors hover:border-slate-500 focus-visible:border-blue-500',
            selectClassName,
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <TokenIcon token={selectedToken} />
            <span className="truncate">{selectedLabel}</span>
          </span>
          <span className="text-xs text-slate-500 transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>

        <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/98 p-2 shadow-2xl shadow-black/40">
          {options.map((token) => {
            const isSelected = sameAddress(token.address, value);
            const optionLabel = getOptionLabel?.(token) ?? defaultOptionLabel(token);

            return (
              <button
                key={token.address}
                type="button"
                onClick={(event) => {
                  onChange(token.address);
                  event.currentTarget.closest('details')?.removeAttribute('open');
                }}
                className={joinClasses(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                  isSelected
                    ? 'bg-blue-500/15 text-blue-100'
                    : 'text-slate-200 hover:bg-slate-900 hover:text-slate-50',
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <TokenIcon token={token} />
                  <span className="truncate">{optionLabel}</span>
                </span>
                <span className={isSelected ? 'text-blue-300' : 'text-slate-600'}>
                  {isSelected ? 'Selected' : token.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
