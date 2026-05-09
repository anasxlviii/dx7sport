import Link from 'next/link';
import { QuizRenderer } from '@/components/QuizRenderer';

// PREDEFINED GAMES DATA
const GAMES = [
  {
    id: 'transfer-quiz-1',
    title: 'خمن اللاعب من مسيرته',
    description: 'تتبع محطات اللاعب التاريخية واكتشف من هو النجم المتخفي.',
    category: 'Guess the Player',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
    data: {
      type: 'multiple_choice',
      questions: [
        {
          question: 'لعب لـ: سبورتينج لشبونة -> مانشستر يونايتد -> ريال مدريد -> يوفنتوس',
          options: ['ميسي', 'كريستيانو رونالدو', 'بنزيمة', 'مودريتش'],
          correctAnswer: 'كريستيانو رونالدو',
          hint: 'الهداف التاريخي لكرة القدم.',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg'
        },
        {
          question: 'لعب لـ: باريس سان جيرمان -> ميلان -> برشلونة -> أياكس -> يوفنتوس',
          options: ['رونالدينيو', 'إبراهيموفيتش', 'إيتو', 'تياغو سيلفا'],
          correctAnswer: 'إبراهيموفيتش',
          hint: 'الأسد السويدي.',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Zlatan_Ibrahimovi%C3%A7_June_2018.jpg'
        },
        {
           question: 'لعب لـ: دورتموند -> بايرن ميونخ -> برشلونة',
           options: ['ليفاندوفسكي', 'غوتزه', 'هاملز', 'ديمبيلي'],
           correctAnswer: 'ليفاندوفسكي',
           hint: 'ماكينة الأهداف البولندية.',
           imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Robert_Lewandowski_2019.jpg'
        }
      ]
    }
  },
  {
    id: 'logo-quiz-1',
    title: 'تحدي شعارات الأندية',
    description: 'هل تستطيع التعرف على الفريق من نسخة مبسطة من شعاره؟',
    category: 'Logo Quiz',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
    data: {
      type: 'multiple_choice',
      questions: [
        {
          question: 'النادي الملقب بـ "السيدة العجوز" في إيطاليا؟',
          options: ['ميلان', 'يوفنتوس', 'إنتر ميلان', 'روما'],
          correctAnswer: 'يوفنتوس',
          hint: 'يرتدي القميص الأبيض والأسود.',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Juventus_FC_2017_logo.svg/1200px-Juventus_FC_2017_logo.svg.png'
        },
        {
           question: 'نادي إنجليزي يلقب بـ "المدفعجية"؟',
           options: ['ليفربول', 'مانشستر سيتي', 'أرسنال', 'تشيلسي'],
           correctAnswer: 'أرسنال',
           hint: 'يتواجد في شمال لندن.',
           imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png'
        }
      ]
    }
  },
  {
    id: 'crossword-1',
    title: 'الكلمات المتقاطعة الرياضية',
    description: 'اختبر ثقافتك الكروية الشاملة في حل لغز الكلمات.',
    category: 'Crossword',
    image: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=800',
    data: {
      type: 'crossword',
      crossword: {
        grid: [
          ['م', 'و', 'د', 'ر', 'ي', 'ت', 'ش'],
          [null, null, null, null, null, null, 'و'],
          ['ب', 'ر', 'ش', 'ل', 'و', 'ن', 'ة'],
          [null, null, null, null, null, null, 'ب'],
          [null, null, null, null, null, null, 'ا'],
        ],
        clues: {
          across: [
            '1. فائز بالكرة الذهبية 2018 (مودريتش)',
            '2. النادي الفائز بـ 6 بطولات في موسم واحد (برشلونة)'
          ],
          down: [
            '1. الهداف التاريخي لكأس العالم (رونالدو - النسخة القديمة)',
            '2. لقب منتخب إسبانيا (الماتادور)'
          ]
        }
      }
    }
  }
];

export default function EntertainmentPage() {
  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden border-b border-zinc-900">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10" />
         <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center animate-pulse-slow" />
         
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
            {GAMES.map((game) => (
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
