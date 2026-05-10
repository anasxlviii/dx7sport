'use client';

import React from 'react';
import { X, CheckCircle2, XCircle, Search, Trophy, ExternalLink } from 'lucide-react';

interface PipelineLogItem {
  type: 'match' | 'search';
  name: string;
  success: boolean;
  message: string;
  articleId?: number;
}

interface PipelineLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: PipelineLogItem[];
}

export default function PipelineLogModal({ isOpen, onClose, logs }: PipelineLogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 shadow-[0_0_50px_rgba(163,230,53,0.1)] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-lime rounded-full animate-pulse" />
              <h2 className="text-[10px] font-black text-lime uppercase tracking-[0.3em]">تقرير العملية</h2>
            </div>
            <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">نتائج المراسل الشبح</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">لم يتم تنفيذ أي عمليات بعد.</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index}
                className={`group p-4 border transition-all ${
                  log.success 
                    ? 'bg-zinc-900/30 border-zinc-900 hover:border-lime/30' 
                    : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${
                    log.success ? 'bg-lime/10 text-lime' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {log.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {log.type === 'match' ? (
                        <Trophy size={12} className="text-zinc-500" />
                      ) : (
                        <Search size={12} className="text-zinc-500" />
                      )}
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {log.type === 'match' ? 'نتيجة مباراة' : 'بحث إخباري'}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-bold text-white mb-1 truncate">{log.name}</h4>
                    <p className={`text-xs font-medium ${log.success ? 'text-zinc-400' : 'text-red-400'}`}>
                      {log.message}
                    </p>
                  </div>

                  {log.articleId && (
                    <a 
                      href={`/admin/article/${log.articleId}`}
                      className="mt-1 p-2 text-zinc-500 hover:text-lime transition-colors"
                      title="عرض المقال"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-900 bg-zinc-950/50">
          <button
            onClick={onClose}
            className="w-full bg-lime text-black py-3 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all transform active:scale-95"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
}
