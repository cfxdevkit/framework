'use client';

import type { CasJobDto } from '@cfxdevkit/cas-shared';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StrategyBuilder } from './StrategyBuilder';

export function StrategyModal({
  open,
  onClose,
  onJobCreated,
}: {
  open: boolean;
  onClose: () => void;
  onJobCreated: (job: CasJobDto) => void;
}) {
  const [txInProgress] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !txInProgress) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, txInProgress]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Create strategy"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className={`absolute inset-0 w-full h-full bg-black/70 backdrop-blur-sm border-0 ${txInProgress ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={txInProgress ? undefined : onClose}
        onKeyDown={
          txInProgress
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') onClose();
              }
        }
      />
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-[modal-in_0.2s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-semibold text-white tracking-tight">New Strategy</h2>
          <button
            type="button"
            onClick={txInProgress ? undefined : onClose}
            disabled={txInProgress}
            title={txInProgress ? 'Complete or cancel transactions first' : 'Close'}
            className={`p-1 rounded-lg transition-colors ${txInProgress ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <StrategyBuilder
            jobs={[]}
            onJobCreated={(job) => {
              onJobCreated(job);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
