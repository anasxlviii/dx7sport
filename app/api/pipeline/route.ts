import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline/pipeline';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { postContent, postUrl, imageBase64 } = body;

    if (!postContent && !postUrl && !imageBase64) {
      return NextResponse.json(
        { error: 'Either postContent, postUrl, or imageBase64 is required' },
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

    const result = await runPipeline({ postContent, postUrl, imageBase64 });

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple security check
  if (secret !== process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { runAutonomousGhost } = await import('@/lib/pipeline/autonomous');
    const results = await runAutonomousGhost();
    
    return NextResponse.json({
      status: 'success',
      message: 'Autonomous Ghost Reporter finished run',
      results
    });
  } catch (error) {
    console.error('Autonomous run failed:', error);
    return NextResponse.json({ error: 'Autonomous run failed', details: String(error) }, { status: 500 });
  }
}
