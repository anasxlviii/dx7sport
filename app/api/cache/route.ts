import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

export async function GET(req: NextRequest) {
  const f = req.nextUrl.searchParams.get('f');
  if (!f) return new NextResponse('Missing f param', { status: 400 });

  const safe = path.normalize(f).replace(/^\.\.(\/|\\)/, '');
  const filePath = path.join(CACHE_DIR, safe);

  if (!filePath.startsWith(CACHE_DIR)) {
    return new NextResponse('Invalid path', { status: 403 });
  }

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    return new NextResponse(data, {
      headers: {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
