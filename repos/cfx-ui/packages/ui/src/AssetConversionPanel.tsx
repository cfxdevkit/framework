export interface AssetConversionPanelProps {
  amount: string;
  amountLabel?: string;
  busy?: boolean;
  className?: string;
  error?: string | null;
  fromAssetLabel: string;
  maxAmountLabel?: string;
  mode: 'wrap' | 'unwrap';
  onAmountChange: (value: string) => void;
  onMax?: () => void;
  onModeChange: (mode: 'wrap' | 'unwrap') => void;
  onSubmit: () => void;
  submitLabel?: string;
  success?: string | null;
  title?: string;
  toAssetLabel: string;
  wrapLabel?: string;
  unwrapLabel?: string;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function AssetConversionPanel({
  amount,
  amountLabel = 'Amount',
  busy = false,
  className,
  error,
  fromAssetLabel,
  maxAmountLabel,
  mode,
  onAmountChange,
  onMax,
  onModeChange,
  onSubmit,
  submitLabel,
  success,
  title = 'Convert asset',
  toAssetLabel,
  wrapLabel = 'Wrap',
  unwrapLabel = 'Unwrap',
}: AssetConversionPanelProps) {
  const activeLabel = mode === 'wrap' ? wrapLabel : unwrapLabel;

  return (
    <div
      className={joinClasses(
        'rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-100',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-50">{title}</p>
          <p className="text-xs text-slate-400">
            {fromAssetLabel} to {toAssetLabel} at a 1:1 ratio.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => onModeChange('wrap')}
            className={joinClasses(
              'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
              mode === 'wrap'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
            )}
          >
            {wrapLabel}
          </button>
          <button
            type="button"
            onClick={() => onModeChange('unwrap')}
            className={joinClasses(
              'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
              mode === 'unwrap'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
            )}
          >
            {unwrapLabel}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>{amountLabel}</span>
          {maxAmountLabel ? (
            <button
              type="button"
              onClick={onMax}
              className="font-medium text-blue-300 transition-colors hover:text-blue-200"
            >
              {maxAmountLabel}
            </button>
          ) : null}
        </div>

        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0.0"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-20 text-base text-slate-50 outline-none transition-colors focus:border-blue-500"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {mode === 'wrap' ? fromAssetLabel : toAssetLabel}
          </span>
        </div>

        <p className="text-center text-xs text-slate-500">
          {activeLabel} {mode === 'wrap' ? fromAssetLabel : toAssetLabel} into{' '}
          {mode === 'wrap' ? toAssetLabel : fromAssetLabel}.
        </p>

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !amount}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {busy
            ? 'Processing…'
            : (submitLabel ?? `${activeLabel} ${mode === 'wrap' ? fromAssetLabel : toAssetLabel}`)}
        </button>
      </div>
    </div>
  );
}
