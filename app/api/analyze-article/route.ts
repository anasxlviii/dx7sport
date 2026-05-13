import { NextRequest, NextResponse } from 'next/server';
import { executeWithAI } from '@/lib/pipeline/ai-client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const analysis = await executeWithAI<string>({
      systemPrompt: `أنت محرر صحفي خبير في DX7 SPORT. دورك تحليل المقالات الكروية وتحسينها.

مهمتك: حلل المقال المقدم وأعد تحليلاً منظمًا بالنقاط التالية:

1. **تقييم العنوان**: اقترح 3 عناوين بديلة أفضل (بالعربية الفصحى).
2. **النقاط البارزة**: استخرج 3-5 جمل أو فقرات تستحق التمييز (**عريض**) لأنها تحمل معلومات حاسمة.
3. **الأقسام المفقودة**: حدد أي أقسام مهمة ناقصة (مثلاً: تحليل تكتيكي، إحصائيات، تاريخ المواجهات).
4. **الأخطاء اللغوية**: أشر إلى أي أخطاء لغوية أو أسلوبية.
5. **تحسينات مقترحة**: 2-3 اقتراحات لتحسين جودة المقال.

أعد النتيجة بتنسيق Markdown منظم. استخدم الأرقام العربية المعيارية (1234567890) فقط.`,
      userPrompt: `المقال للتحليل:\n\nالعنوان الحالي: ${title || 'بدون عنوان'}\n\nالمحتوى:\n${content.slice(0, 8000)}`,
      temperature: 0.3,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[API /analyze-article] error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
