'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuizRenderer } from '@/components/QuizRenderer';

const GAMES = [
  {
    id: 'transfer-quiz-1',
    title: 'خمن اللاعب من مسيرته',
    category: 'Guess the Player',
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
    category: 'Logo Quiz',
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
    category: 'Crossword',
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

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  
  const game = GAMES.find(g => g.id === gameId);

  if (!game) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <h1 className="text-4xl font-black text-white mb-8">اللعبة غير موجودة</h1>
        <Link href="/entertainment" className="px-8 py-3 bg-lime text-black font-black uppercase tracking-widest">
           العودة للمركز الترفيهي
        </Link>
      </div>
    );
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

         {/* Game Container - This solves the "small and inaccessible" problem */}
         <div className="bg-zinc-950 border border-zinc-900 p-6 md:p-16 shadow-2xl relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-lime/20 group-hover:bg-lime transition-colors" />
            
            <QuizRenderer data={game.data as any} />
         </div>

         {/* Game Footer */}
         <div className="mt-12 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
            <span>© DX7 ENTERTAINMENT UNIT</span>
            <span>بواسطة الذكاء الاصطناعي</span>
         </div>
      </main>
    </div>
  );
}
