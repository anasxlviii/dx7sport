import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { articles } from '@/lib/db/schema';
import slugify from 'slugify';

export async function GET() {
  const quizData = [
    {
      title: "تحدي الأساطير: خمن اللاعب من تاريخ انتقالاته",
      category: "quiz",
      excerpt: "هل يمكنك معرفة هذا النجم العالمي فقط من خلال الأندية التي لعب لها؟ اختبر ذكائك الكروي الآن.",
      content: "## قوانين اللعبة\n\nأمامك قائمة بالأندية التي لعب لها أحد نجوم كرة القدم عبر تاريخه. كل ما عليك فعله هو اختيار الاسم الصحيح من بين الخيارات المتاحة.\n\nاستمتع بالتحدي!",
      metadata: {
        factBox: "• التحدي يشمل 3 مستويات\n• التركيز على اللاعبين الحاليين والمعتزلين حديثاً\n• تلميحات تكتيكية متاحة",
        quizData: {
          type: "multiple_choice",
          questions: [
            {
              question: "تاريخ الانتقالات: سبورتينغ لشبونة -> مانشستر يونايتد -> ريال مدريد -> يوفنتوس -> مانشستر يونايتد -> النصر",
              options: ["كريستيانو رونالدو", "لويس ناني", "برونو فيرنانديز", "ريكاردو كواريزما"],
              correctAnswer: "كريستيانو رونالدو",
              hint: "يُلقب بصاروخ ماديرا",
              imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg"
            },
            {
              question: "تاريخ الانتقالات: برشلونة -> باريس سان جيرمان -> إنتر ميامي",
              options: ["نيمار جونيور", "ليونيل ميسي", "لويس سواريز", "سيرجيو بوسكيتس"],
              correctAnswer: "ليونيل ميسي",
              hint: "صاحب أكبر عدد من الكرات الذهبية في التاريخ",
              imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg"
            }
          ]
        }
      }
    },
    {
      title: "خمن الفريق من شعاره وتاريخه",
      category: "quiz",
      excerpt: "تحدي خاص لعشاق الأندية الأوروبية. هل تعرف الفريق من خلال ملامح ملعبه وتاريخه؟",
      content: "## هل أنت مشجع حقيقي؟\n\nفي هذا التحدي، سنقدم لك معلومات عن ملاعب وألقاب وألوان أندية أوروبية كبرى. حاول معرفة النادي الصحيح.",
      metadata: {
        factBox: "• يغطي الدوريات الخمس الكبرى\n• معلومات تاريخية دقيقة\n• تحدي السرعة مطلوب",
        quizData: {
          type: "multiple_choice",
          questions: [
            {
              question: "نادي يلقب بـ 'الميرينغي'، ملعبه 'سانتياغو برنابيو'، وصاحب الرقم القياسي في دوري الأبطال",
              options: ["ميلان", "ليفربول", "ريال مدريد", "بايرن ميونخ"],
              correctAnswer: "ريال مدريد",
              hint: "النادي الملكي الإسباني",
              imageUrl: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"
            },
            {
              question: "نادي يلقب بـ 'الريدز'، ملعبه 'أنفيلد'، ونشيده الشهير 'لن تسير وحدك أبداً'",
              options: ["مانشستر يونايتد", "ليفربول", "أرسنال", "تشيلسي"],
              correctAnswer: "ليفربول",
              hint: "نادي النجم المصري محمد صلاح",
              imageUrl: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg"
            }
          ]
        }
      }
    },
    {
      title: "الكلمات المتقاطعة: عمالقة الكرة",
      category: "quiz",
      excerpt: "اختبر ذكائك في أول لعبة كلمات متقاطعة كروية على منصتنا.",
      content: "## تحدي العقول\n\nاملأ المربعات بالكلمات الصحيحة بناءً على التلميحات الجانبية.",
      metadata: {
        factBox: "• كلمات متقاطعة كروية\n• مستويات صعوبة متنوعة",
        quizData: {
          type: "crossword",
          crossword: {
            grid: [
              ["م", "د", "ر", "ي", "د"],
              [null, null, "و", null, null],
              ["م", "ي", "س", "ي", null],
              [null, null, "ي", null, null],
              ["ن", "ص", "ر", null, null]
            ],
            clues: {
              across: ["1. النادي الملكي الإسباني (5 حروف)", "3. أسطورة الأرجنتين (4 حروف)", "5. نادي كريستيانو الحالي (3 حروف)"],
              down: ["1. نجم مصري في ليفربول (رأسياً من 1)", "3. هداف التاريخ (رأسياً من 3)"]
            }
          }
        }
      }
    }
  ];

  try {
    for (const quiz of quizData) {
      const slug = slugify(quiz.title, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 6);
      await db.insert(articles).values({
        title: quiz.title,
        slug: slug,
        category: quiz.category,
        excerpt: quiz.excerpt,
        content: quiz.content,
        status: 'published',
        publishedAt: new Date(),
        metadata: JSON.stringify(quiz.metadata)
      });
    }

    return NextResponse.json({ success: true, message: "Quizzes seeded successfully" });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
