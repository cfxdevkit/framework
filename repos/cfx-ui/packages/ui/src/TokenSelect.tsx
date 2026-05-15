export interface TokenSelectOption {
  address: string;
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

export function TokenSelect<TToken extends TokenSelectOption = TokenSelectOption>({
  className,
  disabled,
  getOptionLabel,
  onChange,
  options,
  selectClassName,
  value,
}: TokenSelectProps<TToken>) {
  return (
    <div className={className}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={joinClasses(
          'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70',
          selectClassName,
        )}
      >
        {options.map((token) => (
          <option key={token.address} value={token.address}>
            {getOptionLabel?.(token) ?? `${token.symbol}${token.name ? ` · ${token.name}` : ''}`}
          </option>
        ))}
      </select>
    </div>
  );
}
