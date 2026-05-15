'use client';

import { ShieldCheck, X } from 'lucide-react';
import { useEffect } from 'react';
import type { CasJobDto } from '@cfxdevkit/cas-shared';
import { ApprovalWidget } from './ApprovalWidget';

export function ApprovalsModal({
  open,
  onClose,
  jobs,
}: {
  open: boolean;
  onClose: () => void;
  jobs: CasJobDto[];
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Manage approvals"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 w-full h-full bg-black/70 backdrop-blur-sm border-0 cursor-pointer"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-[modal-in_0.2s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-conflux-400" /> Token Approvals
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ApprovalWidget jobs={jobs} />
        </div>
      </div>
    </div>
  );
}
