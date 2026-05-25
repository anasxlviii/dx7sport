import Link from 'next/link';
import { db } from '@/lib/db/db';
import { transfers } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

const typeLabels: Record<string, string> = {
  sale: 'بيع نهائي',
  loan: 'إعارة',
  loan_return: 'عودة من إعارة',
  free: 'انتقال حر',
};

const statusLabels: Record<string, { label: string; class: string }> = {
  confirmed: { label: 'تم', class: 'text-lime border-lime/30' },
  rumour: { label: 'شائعة', class: 'text-yellow-400 border-yellow-400/30' },
  done: { label: 'رسمي', class: 'text-lime border-lime/30' },
};

function formatFee(fee: number | null): string {
  if (fee === null || fee === undefined) return 'غير معلن';
  if (fee === 0) return 'مجاني';
  if (fee >= 1000000) return `${(fee / 1000000).toFixed(fee % 1000000 === 0 ? 0 : 1)} مليون €`;
  return `${(fee / 1000).toFixed(0)} ألف €`;
}

export default async function TransfersPage() {
  if (!db) return <div className="min-h-screen bg-black text-white p-20 text-center">قاعدة البيانات غير متصلة</div>;

  const allTransfers = await db.select().from(transfers).orderBy(desc(transfers.createdAt));

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-1.5 border border-lime/50 text-lime text-[10px] font-black uppercase tracking-[0.4em] bg-lime/10 backdrop-blur-sm mb-6">
            سوق الانتقالات
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic text-white uppercase leading-tight py-2">
            آخر <span className="text-lime">صفقات</span> وانتقالات اللاعبين
          </h1>
          <p className="text-gray-500 text-sm font-black uppercase tracking-[0.3em] mt-6">
            متابعة حصرية لكل صفقات سوق الانتقالات المحلية والعالمية
          </p>
        </div>

        {allTransfers.length === 0 ? (
          <div className="border border-zinc-900 bg-zinc-950/50 p-24 text-center">
            <p className="text-gray-600 uppercase tracking-[0.3em] font-black text-xs">لا توجد انتقالات حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allTransfers.map((t) => {
              const st = statusLabels[t.status || 'rumour'];
              return (
                <div key={t.id} className="group bg-zinc-950 border border-zinc-900 overflow-hidden transition-all hover:border-lime/30 hover:-translate-y-1">
                  {/* Player Image */}
                  <div className="relative h-56 overflow-hidden bg-zinc-900">
                    {t.playerImage ? (
                      <Image
                        src={t.playerImage}
                        alt={t.playerName}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-6xl font-black text-zinc-800">{t.playerName.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border bg-black/60 backdrop-blur-md ${st.class}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border border-white/10 bg-black/60 backdrop-blur-md text-white">
                        {typeLabels[t.transferType] || t.transferType}
                      </span>
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-black italic text-white leading-tight mb-4 group-hover:text-lime transition-colors py-1">
                      {t.playerName}
                    </h3>

                    {/* Transfer Path */}
                    <div className="flex items-center gap-2 text-sm mb-4">
                      <span className="text-gray-400 font-medium truncate max-w-[80px]">{t.fromClub}</span>
                      <span className="text-lime text-lg flex-shrink-0">→</span>
                      <span className="text-gray-400 font-medium truncate max-w-[80px]">{t.toClub}</span>
                    </div>

                    {/* Fee */}
                    <div className="border-t border-zinc-800 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">الرسوم</span>
                        <span className="text-lime font-black text-lg">{formatFee(t.feeEuros)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-20">
          <Link
            href="/"
            className="border border-zinc-800 text-gray-400 px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all inline-block"
          >
            ← العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
