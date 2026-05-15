import { type AddEthereumChainParameter, useNetworkSwitchController } from '@cfxdevkit/ui-core';

export interface NetworkSwitchNoticeProps {
  addChainParams?: AddEthereumChainParameter;
  buttonClassName?: string;
  chainName: string;
  className?: string;
  expectedChainId: number;
  message?: string;
  preview?: {
    error?: string | null;
    isSwitching?: boolean;
  };
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function NetworkSwitchNotice({
  addChainParams,
  buttonClassName,
  chainName,
  className,
  expectedChainId,
  message,
  preview,
}: NetworkSwitchNoticeProps) {
  const controller = useNetworkSwitchController({ addChainParams, expectedChainId });

  const error = preview?.error ?? controller.error;
  const isSwitching = preview?.isSwitching ?? controller.isSwitching;
  const isVisible = preview ? true : controller.isWrongNetwork;

  if (!isVisible) return null;

  return (
    <div
      className={joinClasses(
        'flex items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="font-medium">{message ?? `Switch to ${chainName} to continue.`}</p>
        {error ? <p className="text-xs text-red-200">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={preview ? undefined : () => void controller.switchNetwork()}
        disabled={preview ? true : isSwitching}
        className={joinClasses(
          'rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-200',
          buttonClassName,
        )}
      >
        {isSwitching ? 'Switching…' : `Switch to ${chainName}`}
      </button>
    </div>
  );
}
