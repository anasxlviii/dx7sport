'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  isDestructive = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
        {/* Top Accent Line */}
        <div className={`h-1 w-full ${isDestructive ? 'bg-red-600' : 'bg-lime'}`} />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-zinc-600 hover:text-white transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDestructive ? 'bg-red-900/20 text-red-500' : 'bg-lime/10 text-lime'}`}>
            <AlertTriangle size={32} />
          </div>

          <h2 className="text-xs font-black text-white uppercase tracking-[0.4em] mb-4">{title}</h2>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed mb-10">
            {message}
          </p>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-zinc-700 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3 font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] ${
                isDestructive 
                  ? 'bg-red-900 text-white hover:bg-red-600' 
                  : 'bg-lime text-black hover:bg-white'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
