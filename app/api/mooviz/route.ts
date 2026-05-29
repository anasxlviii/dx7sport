import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { join } from 'path';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SVG_PATH = join(process.cwd(), 'public', 'mooviz_hub.svg');

const GENRE_STYLES: Record<string, { accent: string; overlay: [number, number, number] }> = {
  'فانتازيا':        { accent: '#c084fc', overlay: [192, 132, 252] },
  'جريمة':           { accent: '#ef4444', overlay: [239, 68, 68] },
  'رعب':             { accent: '#dc2626', overlay: [220, 38, 38] },
  'خيال علمي':       { accent: '#38bdf8', overlay: [56, 189, 248] },
  'دراما تاريخية':   { accent: '#d4a574', overlay: [212, 165, 116] },
  'دراما':           { accent: '#f59e0b', overlay: [245, 158, 11] },
  'إثارة':           { accent: '#f43f5e', overlay: [244, 63, 94] },
  'غموض':            { accent: '#a78bfa', overlay: [167, 139, 250] },
  'كوميدي':          { accent: '#4ade80', overlay: [74, 222, 128] },
  'أنمي':            { accent: '#f472b6', overlay: [244, 114, 182] },
  'أكشن':            { accent: '#fb923c', overlay: [251, 146, 60] },
  'تاريخي':          { accent: '#eab308', overlay: [234, 179, 8] },
  'رسوم متحركة':     { accent: '#22d3ee', overlay: [34, 211, 238] },
  'مغامرة':          { accent: '#34d399', overlay: [52, 211, 153] },
};

function wrapText(text: string, maxChars: number) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line.trim()) lines.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function escapeXml(s: any) {
  if (!s) return '';
  if (typeof s !== 'string') s = String(s);
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function escFfmpeg(t: any) {
  if (!t) return '';
  if (typeof t !== 'string') t = String(t);
  return t.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/:/g, '\\:');
}

async function loadBackdrop(url: string, w: number, h: number) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata();
    if ((meta.width || 0) < 200 || (meta.height || 0) < 200) return null;
    return sharp(buf).resize(w, h, { fit: 'cover', position: 'entropy' }).png().toBuffer();
  } catch {
    return null;
  }
}

function fallbackBg(w: number, h: number) {
  return sharp({
    create: { width: w, height: h, channels: 3, background: { r: 10, g: 15, b: 30 } },
  }).png().toBuffer();
}

function createGradientOverlay(w: number, h: number) {
  return Buffer.from(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(10, 15, 30, 0.45)"/>
        <stop offset="35%" stop-color="rgba(8, 12, 28, 0.65)"/>
        <stop offset="70%" stop-color="rgba(4, 6, 18, 0.88)"/>
        <stop offset="100%" stop-color="rgba(2, 3, 10, 0.98)"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#blueGrad)"/>
  </svg>`);
}

function createTextOverlay(w: number, h: number, genre: string, bodyLines: string[], titleAr: string, titleEn: string, accentColor: string) {
  const badgeW = genre.length * 15 + 24;
  const badgeX = 627 - badgeW / 2;
  
  // Dynamic font size for Arabic Title to prevent offboard clipping
  let titleArFontSize = 48;
  if (titleAr.length > 35) {
    titleArFontSize = 30;
  } else if (titleAr.length > 25) {
    titleArFontSize = 38;
  }
  
  // Dynamic font size for English Subtitle to prevent offboard clipping
  let titleEnFontSize = 26;
  if (titleEn.length > 35) {
    titleEnFontSize = 18;
  } else if (titleEn.length > 25) {
    titleEnFontSize = 22;
  }
  
  return Buffer.from(`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title-ar {
        font-family: 'Noto Kufi Arabic', 'Cairo', 'Noto Sans Arabic', sans-serif;
        font-size: ${titleArFontSize}px;
        font-weight: 800;
        fill: #ffffff;
        text-anchor: middle;
        direction: rtl;
        unicode-bidi: embed;
      }
      .title-en {
        font-family: 'Geist', 'Noto Sans', 'Segoe UI', sans-serif;
        font-size: ${titleEnFontSize}px;
        font-weight: 700;
        fill: #00e5ff;
        text-anchor: middle;
        letter-spacing: 0.5px;
      }
      .genre-badge-text {
        font-family: 'Noto Kufi Arabic', 'Cairo', sans-serif;
        font-size: 13px;
        font-weight: 700;
        fill: ${accentColor};
        text-anchor: middle;
      }
      .body-text {
        font-family: 'Noto Kufi Arabic', 'Cairo', 'Noto Sans Arabic', sans-serif;
        font-size: 21px;
        font-weight: 400;
        fill: rgba(255, 255, 255, 0.72);
        text-anchor: middle;
        direction: rtl;
        unicode-bidi: embed;
      }
    </style>

    <!-- Genre Badge -->
    <rect x="${badgeX}" y="775" rx="5" width="${badgeW}" height="32" fill="rgba(0, 229, 255, 0.08)" stroke="${accentColor}" stroke-width="1.5"/>
    <text x="627" y="796" class="genre-badge-text">${genre.toUpperCase()}</text>

    <!-- Arabic Title (centered Noto Kufi Arabic, styled RTL) -->
    <text x="627" y="865" class="title-ar" direction="rtl">${escapeXml(titleAr)}</text>

    <!-- English Subtitle -->
    <text x="627" y="910" class="title-en">${escapeXml(titleEn)}</text>

    <!-- Body Text -->
    ${bodyLines.slice(0, 5).map((l, i) =>
      `<text x="627" y="${965 + i * 36}" class="body-text" direction="rtl">${escapeXml(l)}</text>`
    ).join('\n    ')}
  </svg>`);
}

function getFbCredentials() {
  let pageId = process.env.FB_PAGE_ID;
  let accessToken = process.env.FB_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN;
  
  if (!pageId || !accessToken) {
    const envPaths = [
      '/var/dx7sport/auto-fb/.env',
      join(process.cwd(), 'scripts', 'auto-fb', '.env')
    ];
    for (const p of envPaths) {
      if (existsSync(p)) {
        try {
          const lines = readFileSync(p, 'utf-8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const parts = trimmed.split('=');
              if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
                if (key === 'FB_PAGE_ID') pageId = pageId || value;
                if (key === 'FB_ACCESS_TOKEN' || key === 'FB_PAGE_ACCESS_TOKEN') accessToken = accessToken || value;
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse env file', p, e);
        }
      }
    }
  }
  
  return { pageId, accessToken };
}

async function postToFacebook(mediaBuffer: Buffer, caption: string, pageId: string, token: string, type: 'image' | 'reel' | 'quick_reel') {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const crlf = '\r\n';
  const isVideo = type === 'reel' || type === 'quick_reel';
  const filename = isVideo ? 'post.mp4' : 'post.png';
  const contentType = isVideo ? 'video/mp4' : 'image/png';
  
  const captionFieldName = isVideo ? 'description' : 'caption';
  
  const parts = [
    `--${boundary}${crlf}Content-Disposition: form-data; name="source"; filename="${filename}"${crlf}Content-Type: ${contentType}${crlf}${crlf}`,
    mediaBuffer,
    `${crlf}--${boundary}${crlf}Content-Disposition: form-data; name="${captionFieldName}"${crlf}${crlf}${caption}${crlf}--${boundary}--${crlf}`,
  ];

  const header = Buffer.from(parts[0] as string, 'utf-8');
  const footer = Buffer.from(parts[2] as string, 'utf-8');
  const body = Buffer.concat([header, parts[1] as Buffer, footer]);

  const endpoint = isVideo ? 'videos' : 'photos';
  const url = `https://graph.facebook.com/v22.0/${pageId}/${endpoint}?access_token=${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

export async function POST(req: Request) {
  try {
    const post = await req.json();
    let { en, ar, genre, extract, imageUrl, type, duration, action, caption } = post;

    if (typeof en !== 'string') en = String(en || '');
    if (typeof ar !== 'string') ar = String(ar || '');
    if (typeof extract !== 'string') extract = String(extract || '');
    if (typeof imageUrl !== 'string') imageUrl = String(imageUrl || '');

    const isReel = type === 'reel';
    const isQuickReel = type === 'quick_reel';
    const isPostAction = action === 'post';
    let mediaBuffer: Buffer | null = null;
    const style = GENRE_STYLES[genre] || { accent: '#00e5ff', overlay: [0, 229, 255] };
    const accentColor = style.accent;
    const bodyText = (extract || '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 350);

    // ==================== IMAGE & QUICK REEL GENERATION ====================
    if (!isReel) {
      const W = 1254, H = 1254;
      let base = await loadBackdrop(imageUrl, W, H);
      if (!base) {
        base = await fallbackBg(W, H);
      }

      const gradOverlay = createGradientOverlay(W, H);
      const bodyLines = wrapText(bodyText, 54);
      const textOverlay = createTextOverlay(W, H, genre, bodyLines, ar, en, accentColor);

      const result = await sharp(base)
        .composite([
          { input: gradOverlay, top: 0, left: 0 },
          { input: SVG_PATH, top: 0, left: 0 },
          { input: textOverlay, top: 0, left: 0 }
        ])
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();

      if (isQuickReel) {
        const DURATION = 3;
        const FPS = 30;
        const totalFrames = DURATION * FPS;

        const bgPath = join(tmpdir(), `mooviz_quick_bg_${Date.now()}.jpg`);
        const outPath = join(tmpdir(), `mooviz_quick_out_${Date.now()}.mp4`);

        writeFileSync(bgPath, result);

        const vf = `scale=1080:1080`;
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? undefined : '/bin/bash';
        const cmd = `ffmpeg -y -loop 1 -i "${bgPath}" -c:v libx264 -t ${DURATION} -pix_fmt yuv420p -vf "${vf}" "${outPath}"`;

        try {
          execSync(cmd, { stdio: 'pipe', timeout: 30000, shell });
        } catch (err: any) {
          try { unlinkSync(bgPath); } catch {}
          throw new Error(`Quick Reel FFmpeg failed: ${err.message}. Verify FFmpeg is installed.`);
        }

        const videoBuffer = readFileSync(outPath);

        // Clean up temp files
        try { unlinkSync(bgPath); } catch {}
        try { unlinkSync(outPath); } catch {}

        if (isPostAction) {
          mediaBuffer = videoBuffer;
        } else {
          return new Response(new Uint8Array(videoBuffer), {
            headers: {
              'Content-Type': 'video/mp4',
              'Cache-Control': 'public, max-age=60, s-maxage=60',
            },
          });
        }
      } else {
        if (isPostAction) {
          mediaBuffer = result;
        } else {
          return new Response(new Uint8Array(result), {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=60, s-maxage=60',
            },
          });
        }
      }
    }

    // ==================== REEL GENERATION ====================
    const W = 1080, H = 1920;
    const DURATION = Math.min(60, Math.max(5, Number(duration) || 30));
    const FPS = 30;
    const totalFrames = DURATION * FPS;

    const bgPath = join(tmpdir(), `mooviz_reel_bg_${Date.now()}.png`);
    const outPath = join(tmpdir(), `mooviz_reel_out_${Date.now()}.mp4`);

    let base = await loadBackdrop(imageUrl, W, H);
    if (!base) {
      base = await sharp({ create: { width: W, height: H, channels: 3, background: { r: 20, g: 20, b: 35 } } }).png().toBuffer();
    }
    writeFileSync(bgPath, base);

    // Cross-platform custom font resolving
    const isWindows = process.platform === 'win32';
    const localFontPath = isWindows 
      ? join(process.cwd(), 'scripts', 'auto-fb', 'fonts', 'NotoKufiArabic-Variable.ttf')
      : '/var/dx7sport/auto-fb/fonts/NotoKufiArabic-Variable.ttf';

    const fontAr = `:fontfile='${localFontPath.replace(/\\/g, '/')}'`;
    const fontArBold = `:fontfile='${localFontPath.replace(/\\/g, '/')}'`;
    const fontEn = isWindows ? '' : ":fontfile='/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf'";

    const txtAr = escFfmpeg(ar);
    const txtEn = escFfmpeg(en);
    const txtGenre = escFfmpeg(genre);
    const txtBody = escFfmpeg(bodyText.slice(0, 180));

    const drawTitle = `drawtext=text='${txtAr}'${fontArBold}:fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h-450:shadowy=2:shadowcolor=black@0.6:enable='between(t,0.5,${DURATION})'`;
    const drawSub = `drawtext=text='${txtEn}'${fontEn}:fontsize=24:fontcolor=white@0.85:x=(w-text_w)/2:y=h-380:shadowy=2:shadowcolor=black@0.6:enable='between(t,1,${DURATION})'`;
    const drawGenre = `drawtext=text='${txtGenre}'${fontEn}:fontsize=14:fontcolor=white@0.5:x=(w-text_w)/2:y=h-320:enable='between(t,1.5,${DURATION})'`;
    const drawBody = `drawtext=text='${txtBody}'${fontAr}:fontsize=18:fontcolor=white@0.6:x=(w-text_w)/2:y=h-280:shadowy=1:shadowcolor=black@0.5:enable='between(t,2,${DURATION})'`;

    const vf = `zoompan=z='if(lte(on,1),1,min(1.10,1+0.0015*on))':d=${totalFrames}:s=${W}x${H}:fps=${FPS},${drawTitle},${drawSub},${drawGenre},${drawBody}`;

    const shell = isWindows ? undefined : '/bin/bash';
    const cmd = `ffmpeg -y -loop 1 -i "${bgPath}" -c:v libx264 -t ${DURATION} -pix_fmt yuv420p -vf "${vf}" "${outPath}"`;

    try {
      execSync(cmd, { stdio: 'pipe', timeout: 120000, shell });
    } catch (err: any) {
      throw new Error(`FFmpeg failed: ${err.message}. Please verify FFmpeg is installed.`);
    }

    const videoBuffer = readFileSync(outPath);

    // Clean up temp files
    try { unlinkSync(bgPath); } catch {}
    try { unlinkSync(outPath); } catch {}

    if (isPostAction) {
      mediaBuffer = videoBuffer;
    } else {
      return new Response(new Uint8Array(videoBuffer), {
        headers: {
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      });
    }

    if (isPostAction) {
      const { pageId, accessToken } = getFbCredentials();
      if (!pageId || !accessToken) {
        return NextResponse.json({ error: 'Facebook credentials not found. Configure FB_PAGE_ID and FB_ACCESS_TOKEN.' }, { status: 400 });
      }
      const resFb = await postToFacebook(mediaBuffer!, caption || '', pageId, accessToken, type);
      return NextResponse.json({ success: true, postId: resFb.id || resFb.post_id });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
