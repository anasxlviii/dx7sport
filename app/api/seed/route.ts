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
      title: "الكلمات المتقاطعة: عمالقة الكرة (مستويات)",
      category: "quiz",
      excerpt: "ثلاث مراحل من التحدي الكروي. ابدأ من السهل وصولاً للصعب!",
      content: "## تحدي العقول\n\nاملأ المربعات بالكلمات الصحيحة بناءً على التلميحات الجانبية. كل مرحلة أصعب من التي قبلها!",
      metadata: {
        factBox: "• 3 مراحل متدرجة الصعوبة\n• كلمات متقاطعة كروية\n• مستوى سهل ← متوسط ← صعب",
        quizData: {
          type: "crossword",
          levels: [
            {
              name: "البداية",
              difficulty: "easy",
              description: "كلمات كروية أساسية. ابدأ هنا واعتاد على طريقة اللعب.",
              data: {
                grid: [
                  ["ف", "ر", "ق"],
                  ["ر", "ك", "ل"],
                  ["ق", "ل", "ب"]
                ],
                clues: {
                  across: [
                    { number: 1, clue: "مجموعات الأندية التي تتنافس في الدوري. كل دوري يضم العشرات منها. (3 حروف)", row: 0, col: 0, answer: "فرق" },
                    { number: 2, clue: "حركة أساسية في كرة القدم: ضرب الكرة بالقدم بقوة أو بخفة. (3 حروف)", row: 1, col: 0, answer: "ركل" },
                    { number: 3, clue: "مركز لاعب خط الوسط — شريان اللعب بين الدفاع والهجوم. (3 حروف)", row: 2, col: 0, answer: "قلب" }
                  ],
                  down: [
                    { number: 1, clue: "الاختلاف في عدد النقاط بين الأندية في جدول الترتيب. (3 حروف)", row: 0, col: 0, answer: "فرق" },
                    { number: 2, clue: "طريقة تسديد الكرة تجاه المرمى باستخدام مقدمة القدم. (3 حروف)", row: 0, col: 1, answer: "ركل" },
                    { number: 3, clue: "عضو حيوي في تشكيلة الفريق — اللاعب الذي يربط الخطوط. (3 حروف)", row: 0, col: 2, answer: "قلب" }
                  ]
                }
              }
            },
            {
              name: "التطور",
              difficulty: "medium",
              description: "مصطلحات متقدمة. هل تعرف معنى هذه الكلمات الكروية؟",
              data: {
                grid: [
                  ["ه", "د", "ف"],
                  ["د", "ف", "ع"],
                  ["ف", "ع", "ل"]
                ],
                clues: {
                  across: [
                    { number: 1, clue: "غاية كل مباراة: إيداع الكرة في شباك الخصم. يسجله المهاجمون. (3 حروف)", row: 0, col: 0, answer: "هدف" },
                    { number: 2, clue: "حركة لإبعاد الكرة أو تغيير اتجاهها باستخدام أي جزء من الجسم (في الحدود المسموحة). (3 حروف)", row: 1, col: 0, answer: "دفع" },
                    { number: 3, clue: "ما يفعله اللاعبون في الملعب: الجري، التمرير، التسديد — كل حركة بدنية مقصودة. (3 حروف)", row: 2, col: 0, answer: "فعل" }
                  ],
                  down: [
                    { number: 1, clue: "الشيء الذي يتم تسجيله — كل مرة تعبر الكرة خط المرمى. (3 حروف)", row: 0, col: 0, answer: "هدف" },
                    { number: 2, clue: "إبعاد الكرة عن منطقة الجزاء بقوة باستخدام القدم. (3 حروف)", row: 0, col: 1, answer: "دفع" },
                    { number: 3, clue: "الحركة الرياضية التي يقوم بها اللاعب — مرادف لـ 'العمل' في الملعب. (3 حروف)", row: 0, col: 2, answer: "فعل" }
                  ]
                }
              }
            },
            {
              name: "الاحتراف",
              difficulty: "hard",
              description: "كلمات متقاطعة لمتذوقي كرة القدم. هل تصل إلى المستوى الاحترافي؟",
              data: {
                grid: [
                  ["ن", "ج", "م"],
                  ["ج", "د", "ي"],
                  ["م", "ي", "ل"]
                ],
                clues: {
                  across: [
                    { number: 1, clue: "لقب يطلق على أفضل لاعبي العالم — من أمثال ميسي ورونالدو. كل نادٍ يسعى لامتلاكه. (3 حروف)", row: 0, col: 0, answer: "نجم" },
                    { number: 2, clue: "صفة اللاعب المنضبط الذي يلتزم بالتدريبات ولا يستهين بالمباريات. الأساس الذي تبنى عليه البطولات. (3 حروف)", row: 1, col: 0, answer: "جدي" },
                    { number: 3, clue: "الاتجاه الذي تميل إليه الكرة بعد تسديدها — أو تفضيل فريق على آخر في التشجيع. (3 حروف)", row: 2, col: 0, answer: "ميل" }
                  ],
                  down: [
                    { number: 1, clue: "شخصية رياضية لامعة تشرق في سماء البطولة. يأتي منه القدوة للشباب. (3 حروف)", row: 0, col: 0, answer: "نجم" },
                    { number: 2, clue: "عكس المزاجي — اللاعب الذي يؤدي واجبه بإخلاص دون تقصير. (3 حروف)", row: 0, col: 1, answer: "جدي" },
                    { number: 3, clue: "نزعة أو تفضيل — قد يكون ميلاً لطريقة لعب معينة أو لنادٍ على آخر. (3 حروف)", row: 0, col: 2, answer: "ميل" }
                  ]
                }
              }
            }
          ]
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
