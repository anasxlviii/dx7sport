import { getTopLeaguesScores } from '@/lib/pipeline/sportsdb';
import { ScoreSection } from '@/components/ScoreSection';

export const revalidate = 60;

export default async function ScoresPage() {
  const scores = await getTopLeaguesScores();
  
  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <main className="pt-32 pb-24">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="inline-block px-4 py-1.5 mb-8 border border-lime/50 text-lime text-[10px] font-black uppercase tracking-[0.4em] bg-lime/5">
            مركز النتائج المباشرة
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-8 italic tracking-tighter uppercase dxt-gradient-text leading-[0.9]">
            المباريات <br /> والنتائج
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed">
            تغطية حية لنتائج أهم الدوريات الأوروبية الخمسة الكبرى. تحديثات لحظية للأهداف، التوقيت، وحالة المباريات.
          </p>
        </div>

        <ScoreSection 
          scores={scores} 
          title="تغطية شاملة للدوريات الكبرى" 
          isPage={true} 
        />
        
        {scores.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center border border-zinc-900 bg-zinc-950/50">
             <p className="text-zinc-600 font-black uppercase tracking-[0.3em]">لا توجد مباريات جارية حالياً.</p>
          </div>
        )}
      </main>
    </div>
  );
}

