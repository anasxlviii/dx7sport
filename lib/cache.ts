import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24h for images
const DATA_CACHE_DURATION_MS = 5 * 60 * 1000; // 5min for API data

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getCachePath(url: string, prefix: string): string {
  const ext = path.extname(url) || '.png';
  const name = Buffer.from(url).toString('base64url').slice(0, 64);
  return path.join(CACHE_DIR, prefix, `${name}${ext}`);
}

function isFresh(filePath: string, maxAge: number): boolean {
  try {
    return Date.now() - fs.statSync(filePath).mtimeMs < maxAge;
  } catch {
    return false;
  }
}

export function getCachedImageUrl(url: string): string | null {
  const cachePath = getCachePath(url, 'images');
  if (isFresh(cachePath, CACHE_DURATION_MS)) {
    return `/api/cache?f=${encodeURIComponent(path.relative(CACHE_DIR, cachePath))}`;
  }
  return null;
}

export async function downloadAndCache(url: string): Promise<string> {
  const cachePath = getCachePath(url, 'images');
  const cached = getCachedImageUrl(url);
  if (cached) return cached;

  ensureDir(path.dirname(cachePath));

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        fs.writeFileSync(cachePath, Buffer.concat(chunks));
        const relPath = path.relative(CACHE_DIR, cachePath);
        resolve(`/api/cache?f=${encodeURIComponent(relPath)}`);
      });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

export function getCachedData<T>(key: string): T | null {
  const cachePath = path.join(CACHE_DIR, 'data', `${key}.json`);
  if (isFresh(cachePath, DATA_CACHE_DURATION_MS)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as T;
  }
  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  const cachePath = path.join(CACHE_DIR, 'data', `${key}.json`);
  ensureDir(path.dirname(cachePath));
  fs.writeFileSync(cachePath, JSON.stringify(data));
}

export const cache = {
  async image(url: string): Promise<string> {
    try {
      return await downloadAndCache(url);
    } catch {
      return url;
    }
  },
  async data<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = getCachedData<T>(key);
    if (cached) return cached;
    const fresh = await fetcher();
    setCachedData(key, fresh);
    return fresh;
  },
};
