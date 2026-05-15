import { TokenSelect, type TokenSelectOption } from './TokenSelect.js';

export interface TokenPairSelectorProps<TToken extends TokenSelectOption = TokenSelectOption> {
  className?: string;
  inputOptions: readonly TToken[];
  onSwap?: () => void;
  onTokenInChange: (address: string) => void;
  onTokenOutChange: (address: string) => void;
  outputOptions: readonly TToken[];
  tokenInValue: string;
  tokenOutValue: string;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function TokenPairSelector<TToken extends TokenSelectOption = TokenSelectOption>({
  className,
  inputOptions,
  onSwap,
  onTokenInChange,
  onTokenOutChange,
  outputOptions,
  tokenInValue,
  tokenOutValue,
}: TokenPairSelectorProps<TToken>) {
  return (
    <div
      className={joinClasses(
        'grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
        className,
      )}
    >
      <TokenSelect options={inputOptions} value={tokenInValue} onChange={onTokenInChange} />
      <button
        type="button"
        onClick={onSwap}
        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
      >
        ⇄
      </button>
      <TokenSelect options={outputOptions} value={tokenOutValue} onChange={onTokenOutChange} />
    </div>
  );
}
