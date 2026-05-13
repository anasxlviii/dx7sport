import { NextRequest, NextResponse } from 'next/server';
import { executeWithAI } from '@/lib/pipeline/ai-client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'المحتوى قصير جداً' }, { status: 400 });
    }

    const result = await executeWithAI<string>({
      systemPrompt: `أنت محرر صحفي خبير في موقع DX7 SPORT الرياضي. مهمتك إعادة صياغة المقال الرياضي الخام الذي سأعطيك إياه وتحويله إلى مقال منظم وجاهز للنشر.

تعليمات صارمة:
1. حدد العنوان الأنسب من النص الأصلي، وإذا لم يجده فاقترح عنواناً جذاباً.
2. أعد كتابة المحتوى بشكل منظم مع:
   - إضافة عناوين فرعية مناسبة (##) لكل فقرة
   - تمييز الجمل المهمة بالـ **عريض**
   - ترتيب المعلومات بشكل منطقي (خبر رئيسي → تفاصيل → تحليل → خاتمة)
   - إضافة علامات تنصيص واستشهادات عند الاقتضاء
3. اكتب المقدمة القصيرة (excerpt) في جملتين كحد أقصى.
4. حافظ على الدقة الرياضية والمعلوماتية ولا تختلق حقائق.
5. استخدم الأرقام العربية المعيارية (1234567890) فقط. ممنوع استخدام الأرقام العربية الشرقية أو الهندية أو الفارسية.
6. ممنوع استخدام أي رموز أو حروف صينية أو يابانية أو كورية.
7. اكتب بالعربية الفصحى المبسطة المفهومة.

أعد النتيجة بصيغة JSON فقط:
{
  "title": "العنوان المقترح",
  "excerpt": "المقدمة القصيرة",
  "content": "المحتوى المعاد صياغته كاملاً بصيغة Markdown"
}`,
      userPrompt: `النص الخام لإعادة الصياغة:\n\n${content.slice(0, 10000)}`,
      temperature: 0.3,
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          excerpt: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['title', 'content'],
      },
    });

    return NextResponse.json({ article: result });
  } catch (error) {
    console.error('[API /reformulate-article] error:', error);
    return NextResponse.json({ error: 'فشلت إعادة الصياغة' }, { status: 500 });
  }
}
