import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { ExtractedTopic } from './extract-topic';
import { duckduckgoSearch } from './deep-search';
import { executeWithAI } from './ai-client';

/**
 * Sanitizes AI-generated article content:
 * 1. Converts literal \n escape sequences to real newlines
 * 2. Ensures markdown headings (##, ###) have blank lines before/after them
 * 3. Removes stray backslash artifacts
 * 4. Replaces Arabic/Indian numerals with Western digits (1234567890)
 * 5. Strips any Chinese, Korean, or Japanese characters
 * 6. Normalizes team names
 */
function sanitizeArticleContent(raw: string): string {
  let text = raw;

  // Step 1: Convert literal escaped newlines (\\n) to real newlines
  text = text.replace(/\\n/g, '\n');

  // Step 2: Collapse excessive blank lines (more than 2) to exactly 2
  text = text.replace(/\n{3,}/g, '\n\n');

  // Step 3: Ensure headings always have a blank line before them
  text = text.replace(/([^\n])\n(#{1,3} )/g, '$1\n\n$2');

  // Step 4: Ensure headings always have a blank line after them
  text = text.replace(/(#{1,3} .+)\n([^\n])/g, '$1\n\n$2');

  // Step 5: Remove any remaining stray backslashes before punctuation
  text = text.replace(/\\([.,،؛:؟!])/g, '$1');

  // Step 6: Replace Arabic/Indian numerals (٠١٢٣٤٥٦٧٨٩) with Western digits (0123456789)
  const arabicNumerals: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  text = text.replace(/[٠١٢٣٤٥٦٧٨٩]/g, ch => arabicNumerals[ch] || ch);

  // Step 7: Strip any CJK (Chinese/Japanese/Korean) characters
  text = text.replace(/[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/g, '');

  // Step 8: Post-generation safety cleanup for Arabic football styling
  text = text.replace(/بارسا|بارصا|بارشا|Barca|Barça/g, 'برشلونة');
  
  // Step 9: Remove any stray isolated Latin letters
  text = text.replace(/\s[a-zA-Z]{1,3}\s/g, ' ');

  return text.trim();
}

export interface GeneratedArticle {
  title: string;
  content: string;
  excerpt: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  factBox: string;
  sources: Array<{
    url: string;
    title: string;
    credibility: string;
  }>;
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      hint?: string;
    }>;
  };
}

const articleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'SEO-friendly, engaging title',
    },
    excerpt: {
      type: Type.STRING,
      description: '2-3 sentence summary for social media/search',
    },
    content: {
      type: Type.STRING,
      description: 'Full article content in markdown format. For quizzes, explain the game rules.',
    },
    sections: {
      type: Type.ARRAY,
      description: 'Array of sections for the article',
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ['heading', 'content'],
      },
    },
    factBox: {
      type: Type.STRING,
      description: '5-7 bullet points of key facts',
    },
    sources: {
      type: Type.ARRAY,
      description: 'Array of sources used',
      items: {
        type: Type.OBJECT,
        properties: {
          url: { type: Type.STRING },
          title: { type: Type.STRING },
          credibility: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ['url', 'title', 'credibility'],
      },
    },
    quizData: {
      type: Type.OBJECT,
      description:
        'ONLY FOR QUIZZES: Structured data for the quiz game. Create at least 12-15 questions for a deep experience.',
      properties: {
        type: {
          type: Type.STRING,
          enum: ['multiple_choice', 'crossword'],
          description: 'The type of game',
        },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description:
                  "The question text. IMPORTANT: If 'imageUrl' or 'clueLogos' are provided, DO NOT include descriptive spoilers in this text (e.g., stadium names, history). Keep it generic like 'من هو هذا الفريق؟' or 'من هو هذا اللاعب؟'.",
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 possible answers',
              },
              correctAnswer: { type: Type.STRING, description: 'The correct answer' },
              hint: { 
                type: Type.STRING,
                description: 'A professional hint. For visual quizzes, the hint should NOT be too obvious.'
              },
              imageUrl: {
                type: Type.STRING,
                description:
                  'URL for a logo or a BLURRED/HIDDEN version of the player if they are the subject.',
              },
              clueLogos: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'URLs of team logos to show as visual clues (e.g. clubs they played for). USE ONLY REAL URLS.',
              },
            },
            required: ['question', 'options', 'correctAnswer'],
          },
        },
        crossword: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: '2D grid of letters or null',
            },
            clues: {
              type: Type.OBJECT,
              properties: {
                across: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.NUMBER },
                      clue: { type: Type.STRING },
                      row: { type: Type.NUMBER },
                      col: { type: Type.NUMBER },
                      answer: { type: Type.STRING }
                    },
                    required: ['number', 'clue', 'row', 'col', 'answer']
                  } 
                },
                down: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.NUMBER },
                      clue: { type: Type.STRING },
                      row: { type: Type.NUMBER },
                      col: { type: Type.NUMBER },
                      answer: { type: Type.STRING }
                    },
                    required: ['number', 'clue', 'row', 'col', 'answer']
                  } 
                },
              },
            },
          },
        },
      },
      required: ['type'],
    },
  },
  required: ['title', 'excerpt', 'content', 'sections', 'factBox', 'sources'],
};

export async function generateArticle(
  topic: ExtractedTopic,
  factCheckedData?: string,
  originalSourceText?: string
): Promise<GeneratedArticle> {
  try {
    // 1. Perform DuckDuckGo Search for SUPPLEMENTAL tactical depth only
    const searchQuery =
      topic.searchQueries.length > 0 ? topic.searchQueries[0] : topic.title;
    const rawSearchContext = await duckduckgoSearch(searchQuery);

    const SYSTEM_PROMPT = `أنت صحفي كروي أسطوري ومحلل تكتيكي عبقري في DX7 SPORT. تكتب بأسلوب راقٍ يليق بأمجاد الكرة العالمية.

مهمتك: اكتب مقالاً كروياً طويلاً جداً، عميقاً، وملحمياً. هناك دائماً ما يُقال — اغوص في التاريخ، والتفاصيل التكتيكية، والعوامل النفسية، والتأثيرات المستقبلية. اجعل القارئ يعيش التجربة.

ترتيب المصادر (الأهم فالمهم):
- المصدر الأساسي المُطلق: النص التالي "نص المصدر الأصلي" هو أساس مقالتك.
  ---
  ${originalSourceText || 'استخدم ملخص الموضوع كدليل.'}
  ---
- بيانات إضافية (للتوسع التكتيكي فقط):
  * إحصائيات رسمية: ${factCheckedData || 'غير متوفرة'}
  * سياق مباشر من الويب: ${rawSearchContext}

قواعد اللغة والكتابة الصارمة:
- اللغة: عربية فصحى راقية جداً، بليغة، وأدبية. استخدم تراكيب لغوية غنية ومتنوعة. تجنب الجمل القصيرة المتقطعة والركيكة. هذا نص رياضي صحفي يقرأه مثقفون.
- الأرقام: استخدم الأرقام العربية المعيارية (1234567890) حصراً. ممنوع نهائياً استخدام الأرقام الهندية (١٢٣٤٥٦٧٨٩٠) أو كتابة الأرقام ككلمات.
- لا تبدأ المقال بعبارات تمهيدية: ابدأ بمشهد قوي أو ملاحظة تكتيكية آسرة. لا تستخدم "في هذا المقال" أو "سنتحدث عن".
- طول المقال (إلزامي): يجب ألا يقل عن 2500 كلمة. إذا نفدت البيانات، توسع في التاريخ التكتيكي للأندية، أدوار اللاعبين الدقيقة، والتأثير العالمي للحدث.
- التنسيق (إلزامي):
  * العنوان: تحفة تجمع بين تحسين محركات البحث والحكاية الملحمية.
  * العناوين الفرعية: استخدم ## للأقسام الرئيسية و ### للأقسام الفرعية. اجعلها واضحة واحترافية.
  * التقسيم البصري: استخدم --- (خط فاصل) بين الأقسام الكبيرة لتقسيم المقال بصرياً. استخدم > (اقتباس) لعرض إحصائيات مهمة أو تصريحات. استخدم - (نقاط) للقوائم.
  * الخط العريض: استخدم **عريض** فقط لأسماء اللاعبين/المدربين والنتائج والتواريخ المهمة. لا تجعل الجمل كاملة عريضة أبداً.
  * الفقرات: طويلة ومتماسكة، نص عادي بشكل أساسي.
- التحليل التكتيكي: صف ممرات التمرير، ضغوط الاستحواذ، والانتقالات الدفاعية بتفاصيل حية تجعل القارئ يرى الملعب بعين عقله.
- الأسماء الرسمية: استخدم دائماً الأسماء الرسمية الكاملة مثل "برشلونة" و"ريال مدريد" و"مانشستر سيتي".
- لا أحرف صينية: ممنوع نهائياً استخدام أي رموز أو أحرف صينية أو كورية أو أي لغة غير العربية والإنجليزية.
- الإنجليزية: استخدمها فقط للمصطلحات الكروية العالمية التي لا تُترجم (مثل "تيكي تاكا"، "جيجن بريس"، "أوفسايد") أو أسماء اللاعبين الأجانب.
- تاريخ اليوم: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}.

قاعدة الاستبعاد:
- ممنوع نهائياً ذكر أو الإشارة إلى الدوري الإسرائيلي أو الفرق أو اللاعبين الإسرائيليين.

قواعد الاختبارات والمسابقات (للمقالات التفاعلية):
- الدوريات: فقط أفضل 5 دوريات أوروبية + البرتغالي + الهولندي.
- روابط الصور: إلزامية للمسابقات البصرية. استخدم LOGO_URL من البيانات الرسمية.
- لا حرق: إذا كان سؤالاً بصرياً، السؤال = 'من هذا؟' أو 'خمن الفريق'.
- العمق: 15 سؤالاً على الأقل لكل اختبار.

أعد النتيجة بصيغة JSON نقية تطابق المخطط المطلوب.`;

    const prompt = `اكتب مقالاً كروياً احترافياً طويلاً بناءً على هذه المعلومات:

**تحليل الموضوع:**
- التصنيف: ${topic.category}
- العنوان المقترح: ${topic.title}
- الملخص: ${topic.summary}
- الكيانات المذكورة: ${topic.entities.join(', ')}
- الأسئلة الرئيسية التي يجب الإجابة عليها: ${topic.keyQuestions.join(', ')}

**نتائج البحث المباشرة (من الأسبوع الماضي):**
${rawSearchContext ? rawSearchContext : 'لا توجد أخبار حديثة. اعتمد على معرفتك الموثقة.'}

تذكر: الأرقام العربية المعيارية (1234567890) فقط. لا أحرف صينية. لغة عربية فصحى بليغة. مقال طويل جداً ومنظم.`;

    const result = await executeWithAI<GeneratedArticle>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: prompt,
      schema: articleSchema,
    });

    const parsed = result;

    // Defensive type checks
    if (typeof parsed.title !== 'string') parsed.title = String(parsed.title || '');
    if (typeof parsed.content !== 'string') parsed.content = String(parsed.content || '');
    if (typeof parsed.excerpt !== 'string') parsed.excerpt = String(parsed.excerpt || '');

    // Sanitize content
    if (parsed.content) {
      parsed.content = sanitizeArticleContent(parsed.content);
    }
    if (parsed.excerpt) {
      parsed.excerpt = parsed.excerpt.replace(/\\n/g, ' ').replace(/\n+/g, ' ').trim();
    }
    // Sanitize factBox (Handle cases where AI returns an array instead of string)
    if (parsed.factBox) {
      if (Array.isArray(parsed.factBox)) {
        parsed.factBox = (parsed.factBox as string[]).map(item => `• ${item}`).join('\n');
      } else if (typeof parsed.factBox === 'string') {
        parsed.factBox = parsed.factBox.replace(/\\n/g, '\n').trim();
      }
    } else {
      parsed.factBox = '';
    }

    return parsed;
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

export async function regenerateArticle(
  originalContent: string,
  feedback: string
): Promise<string> {
  return executeWithAI<string>({
    systemPrompt: 'Revise this article based on feedback.',
    userPrompt: `Feedback: ${feedback}\n\nContent: ${originalContent}`,
    temperature: 0.7,
  });
}

export async function optimizeForSEO(
  content: string,
  topic: string
): Promise<{
  title: string;
  metaDescription: string;
  keywords: string[];
}> {
  return executeWithAI<{ title: string; metaDescription: string; keywords: string[] }>({
    systemPrompt: 'Optimize this football article for SEO. Return JSON.',
    userPrompt: `Topic: ${topic}\n\nContent: ${content.slice(0, 2000)}`,
    schema: { type: 'object' }, // Simple schema hint for providers
  });
}
