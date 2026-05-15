import { TokenSelect, type TokenSelectOption } from './TokenSelect.js';

export interface TokenAmountFieldProps<TToken extends TokenSelectOption = TokenSelectOption> {
  amount: string;
  amountClassName?: string;
  balance?: string;
  className?: string;
  label?: string;
  onAmountChange: (value: string) => void;
  onTokenChange: (address: string) => void;
  tokens: readonly TToken[];
  tokenValue: string;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function TokenAmountField<TToken extends TokenSelectOption = TokenSelectOption>({
  amount,
  amountClassName,
  balance,
  className,
  label,
  onAmountChange,
  onTokenChange,
  tokens,
  tokenValue,
}: TokenAmountFieldProps<TToken>) {
  return (
    <div className={joinClasses('rounded-2xl border border-slate-800 bg-slate-900 p-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-4 text-xs text-slate-400">
        <span>{label ?? 'Amount'}</span>
        {balance ? <span>Balance: {balance}</span> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          className={joinClasses(
            'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-lg text-slate-50 outline-none transition-colors focus:border-blue-500',
            amountClassName,
          )}
          placeholder="0.0"
        />
        <TokenSelect options={tokens} value={tokenValue} onChange={onTokenChange} />
      </div>
    </div>
  );
}
