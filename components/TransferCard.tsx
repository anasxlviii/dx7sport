import Image from 'next/image';

const typeLabels: Record<string, string> = {
  sale: 'بيع',
  loan: 'إعارة',
  loan_return: 'عودة',
  free: 'حر',
};

const statusLabels: Record<string, { label: string; class: string }> = {
  confirmed: { label: 'تم', class: 'bg-lime/20 text-lime' },
  rumour: { label: 'شائعة', class: 'bg-yellow-400/20 text-yellow-400' },
  done: { label: 'رسمي', class: 'bg-lime/20 text-lime' },
};

function formatFee(fee: number | null): string {
  if (fee === null || fee === undefined) return 'غير معلن';
  if (fee === 0) return 'مجاني';
  if (fee >= 1000000) return `${(fee / 1000000).toFixed(fee % 1000000 === 0 ? 0 : 1)}م €`;
  return `${(fee / 1000).toFixed(0)}أ €`;
}

export function TransferCard({ transfer }: { transfer: any }) {
  const st = statusLabels[transfer.status || 'rumour'];
  return (
    <div className="group bg-zinc-950 border border-zinc-900 overflow-hidden transition-all hover:border-lime/30 hover:-translate-y-1">
      <div className="relative h-40 overflow-hidden bg-zinc-900">
        {transfer.playerImage ? (
          <Image
            src={transfer.playerImage}
            alt={transfer.playerName}
            fill
            sizes="(max-width: 768px) 100vw, 16vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-4xl font-black text-zinc-800">{transfer.playerName.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute top-2 left-2">
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${st.class}`}>
            {st.label}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-black/60 text-white border border-white/10">
            {typeLabels[transfer.transferType] || transfer.transferType}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-black italic text-white leading-tight mb-2 group-hover:text-lime transition-colors truncate py-0.5">
          {transfer.playerName}
        </h3>

        <div className="flex items-center gap-1 text-xs mb-2">
          <span className="text-gray-500 truncate max-w-[70px]">{transfer.fromClub}</span>
          <span className="text-lime flex-shrink-0">→</span>
          <span className="text-gray-500 truncate max-w-[70px]">{transfer.toClub}</span>
        </div>

        <div className="border-t border-zinc-800 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">الرسوم</span>
            <span className="text-lime font-black text-sm">{formatFee(transfer.feeEuros)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
