import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline/pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { postContent, postUrl } = body;

    if (!postContent) {
      return NextResponse.json(
        { error: 'postContent is required' },
        { status: 400 }
      );
    }

    // Validate API keys
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    const result = await runPipeline({ postContent, postUrl });

    if (result.success && result.article) {
      return NextResponse.json({
        success: true,
        article: result.article,
        steps: result.steps,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Pipeline failed',
          steps: result.steps,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Pipeline API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Pipeline API is running',
    configured: !!process.env.GOOGLE_AI_API_KEY,
  });
}
