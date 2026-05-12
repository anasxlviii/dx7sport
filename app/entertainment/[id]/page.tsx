import { db } from '@/lib/db/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { QuizRenderer } from '@/components/QuizRenderer';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

const STATIC_GAMES = [
  {
    id: 'logo-quiz-mega',
    title: 'تحدي شعارات الأندية العالمية',
    category: 'Logo Quiz',
    data: {
      type: 'multiple_choice',
      questions: [
        { question: 'ما هو هذا الفريق؟', options: ['ريال مدريد', 'برشلونة', 'أتلتيكو مدريد', 'ميلان'], correctAnswer: 'ريال مدريد', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/v298v11548784112.png' },
        { question: 'ما هو هذا الفريق؟', options: ['بايرن ميونخ', 'برشلونة', 'باريس سان جيرمان', 'مانشستر سيتي'], correctAnswer: 'برشلونة', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/0906801594917454.png' },
        { question: 'ما هو هذا الفريق؟', options: ['ليفربول', 'مانشستر يونايتد', 'أرسنال', 'تشيلسي'], correctAnswer: 'مانشستر يونايتد', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/ov8jcl1549109033.png' },
        { question: 'ما هو هذا الفريق؟', options: ['ليفربول', 'مانشستر سيتي', 'أرسنال', 'توتنهام'], correctAnswer: 'ليفربول', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/7f9vpk1548784277.png' },
        { question: 'ما هو هذا الفريق؟', options: ['أرسنال', 'تشيلسي', 'إيفرتون', 'أستون فيلا'], correctAnswer: 'أرسنال', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/dfh87n1549109312.png' },
        { question: 'ما هو هذا الفريق؟', options: ['مانشستر سيتي', 'نيوكاسل', 'ليستر سيتي', 'برايتون'], correctAnswer: 'مانشستر سيتي', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/v9st3y1549109156.png' },
        { question: 'ما هو هذا الفريق؟', options: ['بايرن ميونخ', 'دورتموند', 'لايبزيج', 'ليفركوزن'], correctAnswer: 'بايرن ميونخ', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/68fne61548784405.png' },
        { question: 'ما هو هذا الفريق؟', options: ['يوفنتوس', 'ميلان', 'إنتر ميلان', 'روما'], correctAnswer: 'يوفنتوس', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/78151594917631.png' },
        { question: 'ما هو هذا الفريق؟', options: ['إنتر ميلان', 'ميلان', 'يوفنتوس', 'نابولي'], correctAnswer: 'ميلان', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/9f38f11550143894.png' },
        { question: 'ما هو هذا الفريق؟', options: ['إنتر ميلان', 'ميلان', 'لاتسيو', 'أتالانتا'], correctAnswer: 'إنتر ميلان', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/p3h13y1617109550.png' },
        { question: 'ما هو هذا الفريق؟', options: ['باريس سان جيرمان', 'مارسيليا', 'ليون', 'موناكو'], correctAnswer: 'باريس سان جيرمان', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/77711594917551.png' },
        { question: 'ما هو هذا الفريق؟', options: ['الهلال', 'النصر', 'الاتحاد', 'الأهلي'], correctAnswer: 'الهلال', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/p0p6qj1553805728.png' },
        { question: 'ما هو هذا الفريق؟', options: ['النصر', 'الهلال', 'الشباب', 'الاتفاق'], correctAnswer: 'النصر', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/dfv3h91553805963.png' },
        { question: 'ما هو هذا الفريق؟', options: ['الأهلي المصري', 'الزمالك', 'بيراميدز', 'فيوتشر'], correctAnswer: 'الأهلي المصري', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/6eia2m1601053158.png' },
        { question: 'ما هو هذا الفريق؟', options: ['الرجاء الرياضي', 'الوداد الرياضي', 'الجيش الملكي', 'نهضة بركان'], correctAnswer: 'الرجاء الرياضي', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/vqupxu1465831005.png' },
        { question: 'ما هو هذا الفريق؟', options: ['الوداد الرياضي', 'الرجاء الرياضي', 'المغرب التطواني', 'اتحاد طنجة'], correctAnswer: 'الوداد الرياضي', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/quuuxy1465831093.png' },
        { question: 'ما هو هذا الفريق؟', options: ['دورتموند', 'بايرن ميونخ', 'مونشنغلادباخ', 'شالكه'], correctAnswer: 'دورتموند', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/7f8f0f1548784437.png' },
        { question: 'ما هو هذا الفريق؟', options: ['أتلتيكو مدريد', 'ريال مدريد', 'إشبيلية', 'فالنسيا'], correctAnswer: 'أتلتيكو مدريد', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/e7tptf1548784218.png' },
        { question: 'ما هو هذا الفريق؟', options: ['نابولي', 'يوفنتوس', 'روما', 'ميلان'], correctAnswer: 'نابولي', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/8i919k1661623838.png' },
        { question: 'ما هو هذا الفريق؟', options: ['باير ليفركوزن', 'دورتموند', 'شتوتغارت', 'بايرن ميونخ'], correctAnswer: 'باير ليفركوزن', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/v6o6o71548784469.png' },
      ]
    }
  }
];

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  
  let game = STATIC_GAMES.find(g => g.id === id);

  if (!game && !isNaN(Number(id))) {
    const dbArticle = await db.query.articles.findFirst({
      where: eq(articles.id, Number(id))
    });

    if (dbArticle && dbArticle.category === 'quiz') {
      try {
        const metadata = JSON.parse(dbArticle.metadata || '{}');
        game = {
          id: dbArticle.id.toString(),
          title: dbArticle.title,
          category: 'AI Challenge',
          data: metadata.quizData
        };
      } catch (e) {
        console.error('Failed to parse quiz metadata', e);
      }
    }
  }

  if (!game) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      {/* Game Navbar */}
      <nav className="h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
         <Link href="/entertainment" className="text-zinc-500 hover:text-lime text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            ← خروج
         </Link>
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-lime rounded-full shadow-[0_0_10px_rgba(179,212,0,1)]" />
            <span className="text-sm font-black italic text-white uppercase tracking-tighter">{game.title}</span>
         </div>
         <div className="w-16" /> {/* Spacer */}
      </nav>

      {/* Main Game Stage */}
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-24">
         <div className="mb-12">
            <span className="text-[10px] font-black text-lime uppercase tracking-[0.5em] mb-2 block">{game.category}</span>
            <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter leading-none">{game.title}</h1>
         </div>

         <div className="bg-zinc-950 border border-zinc-900 p-6 md:p-16 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-lime/20 group-hover:bg-lime transition-colors" />
            <QuizRenderer data={game.data as any} />
         </div>

         <div className="mt-12 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
            <span>© DX7 ENTERTAINMENT UNIT</span>
            <span>بواسطة الذكاء الاصطناعي</span>
         </div>
      </main>
    </div>
  );
}

