import Link from 'next/link';
import { db } from '@/lib/db/db';
import { articles } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

// FEATURED / STATIC GAMES
const FEATURED_GAMES = [
  {
    id: 'logo-quiz-mega',
    title: 'تحدي شعارات الأندية العالمية',
    description: '20 مستوى من الإثارة! هل يمكنك التعرف على أقوى أندية العالم والعرب من شعاراتهم؟',
    category: 'Logo Quiz',
    image: '/hero/entertainment_hub.webp',
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
        { question: 'ما هو this الفريق؟', options: ['الرجاء الرياضي', 'الوداد الرياضي', 'الجيش الملكي', 'نهضة بركان'], correctAnswer: 'الرجاء الرياضي', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/vqupxu1465831005.png' },
        { question: 'ما هو هذا الفريق؟', options: ['الوداد الرياضي', 'الرجاء الرياضي', 'المغرب التطواني', 'اتحاد طنجة'], correctAnswer: 'الوداد الرياضي', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/quuuxy1465831093.png' },
        { question: 'ما هو هذا الفريق؟', options: ['دورتموند', 'بايرن ميونخ', 'مونشنغلادباخ', 'شالكه'], correctAnswer: 'دورتموند', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/7f8f0f1548784437.png' },
        { question: 'ما هو هذا الفريق؟', options: ['أتلتيكو مدريد', 'ريال مدريد', 'إشبيلية', 'فالنسيا'], correctAnswer: 'أتلتيكو مدريد', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/e7tptf1548784218.png' },
        { question: 'ما هو هذا الفريق؟', options: ['نابولي', 'يوفنتوس', 'روما', 'ميلان'], correctAnswer: 'نابولي', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/8i919k1661623838.png' },
        { question: 'ما هو هذا الفريق؟', options: ['باير ليفركوزن', 'دورتموند', 'شتوتغارت', 'بايرن ميونخ'], correctAnswer: 'باير ليفركوزن', imageUrl: 'https://www.thesportsdb.com/images/media/team/badge/v6o6o71548784469.png' },
      ]
    }
  }
];

export default async function EntertainmentPage() {
  // Fetch dynamic quizzes from DB
  const dynamicQuizzes = await db.query.articles.findMany({
    where: eq(articles.category, 'quiz'),
    orderBy: [desc(articles.createdAt)],
    limit: 10
  });

  const allGames = [
    ...FEATURED_GAMES,
    ...dynamicQuizzes.map(q => {
      let quizData = null;
      try {
        quizData = q.metadata ? JSON.parse(q.metadata).quizData : null;
      } catch (e) {
        console.error('Failed to parse quiz metadata', e);
      }
      
      return {
        id: q.id.toString(),
        title: q.title,
        description: q.excerpt || 'تحدي جديد من إنتاج الذكاء الاصطناعي لـ DX7 Sport',
        category: 'AI Challenge',
        image: q.featuredImage || '/hero/entertainment_hub.webp',
        data: quizData
      };
    }).filter(q => q.data) // Only show if valid data exists
  ];

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden border-b border-zinc-900">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10" />
         <div className="absolute inset-0 opacity-40 bg-[url('/hero/entertainment_hub.webp')] bg-cover bg-center animate-pulse-slow" />
         
         <div className="relative z-20 text-center px-4">
            <h2 className="text-xs font-black text-lime uppercase tracking-[0.6em] mb-6 animate-in slide-in-from-top duration-1000">DX7 ENTERTAINMENT HUB</h2>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none mb-8 animate-in zoom-in duration-1000">
               ساحة <span className="text-lime">الألعاب</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed mb-12">
               أثبت للعالم أنك خبير كرة قدم حقيقي. تحديات يومية، ألعاب ذكاء، ومسابقات عالمية.
            </p>
            <div className="flex justify-center gap-6">
               <div className="w-16 h-[2px] bg-lime/30 self-center" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-lime">المتعة تبدأ هنا</span>
               <div className="w-16 h-[2px] bg-lime/30 self-center" />
            </div>
         </div>
      </section>

      {/* Games Selection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
         <div className="flex items-center justify-between mb-16 border-b border-zinc-900 pb-8">
            <div>
               <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">التحديات المتاحة</h3>
               <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mt-2">اختر لعبتك المفضلة وابدأ التحدي الآن</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-black text-lime">
               <span className="animate-pulse">●</span> مباشر الآن
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {allGames.map((game) => (
              <div key={game.id} className="group relative flex flex-col bg-zinc-950 border border-zinc-900 overflow-hidden transition-all hover:border-lime/50">
                 {/* Card Image */}
                 <div className="aspect-[16/9] overflow-hidden relative">
                    <img 
                       src={game.image} 
                       alt={game.title} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                    <div className="absolute top-4 right-4 bg-lime text-black text-[9px] font-black px-3 py-1 uppercase tracking-widest">
                       {game.category}
                    </div>
                 </div>

                 {/* Card Body */}
                 <div className="p-8 flex-1 flex flex-col">
                    <h4 className="text-2xl font-black italic text-white mb-4 group-hover:text-lime transition-colors">
                       {game.title}
                    </h4>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 flex-1">
                       {game.description}
                    </p>
                    
                    <Link 
                       href={`/entertainment/${game.id}`}
                       className="w-full py-4 border border-zinc-800 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white hover:bg-lime hover:text-black hover:border-lime transition-all active:scale-95"
                    >
                       العب الآن <span className="ml-2 group-hover:translate-x-2 transition-transform inline-block">←</span>
                    </Link>
                 </div>
              </div>
            ))}
         </div>
      </section>

      {/* Leaderboard Suggestion */}
      <section className="bg-zinc-950 py-24 border-y border-zinc-900">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="w-12 h-1 bg-lime mx-auto mb-10" />
            <h3 className="text-2xl font-black italic text-white uppercase mb-4">قائمة المتصدرين (قريباً)</h3>
            <p className="text-gray-500 text-sm font-medium leading-loose">
               نحن نعمل على تطوير نظام نقاط عالمي. قريباً ستتمكن من تسجيل الدخول وتحدي أصدقائك وتصدر قائمة أفضل "كوتش" في العالم.
            </p>
         </div>
      </section>
    </div>
  );
}
