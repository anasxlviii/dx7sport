# Facebook Auto Poster — Mooviz Hub

**Project:** Autonomous FB page posting hot, controversial, and new series/movies content in Arabic
**Location:** `/var/dx7sport/auto-fb/` (runs on VPS)
**Status:** ✅ Fully Operational — Premium Mooviz Hub Designer v2 with AI Context Driver, JPEG Output, Extended Captions, Quick Reels, and Custom Duration Reels

---

### Live Curation & Scraper Pipeline v3
- **Scraper Target:** Scrapes Google News RSS for movies, series, and entertainment headlines (100% immune to direct Reddit 403 blocks).
- **Reddit Context:** Queries DuckDuckGo site search `site:reddit.com` for the curated headline to fetch rich discussion snippets without triggering Reddit rate blocks.
- **High-Availability Coordinator:** Rotates 6 Gemini keys; automatically falls back to Groq Llama 3.3-70b on failure. Includes key mapping tolerances (maps `title` and `content` automatically to prevent undefined synopsis crashes).

---

## Interactive Web Designer App

**Web UI Route:** [https://dx7sport.com/mooviz](https://dx7sport.com/mooviz)

### Auto-Poster Agent Control Panel (New)
- **Status Indicator:** Glowing indicator (Pulsing Green for Active, Dim Grey for Paused).
- **Active Toggle:** Premium sliding switch to pause/enable the autonomous agent in real-time by writing to `state.json`.
- **Manual Cycle Trigger:** Executes the full Google News + DDG + AI curation loop in a background thread instantly.
- **Server logs console:** Monospace dark terminal box showing the last 25 lines of `log.txt` (polls every 10 seconds).

### Facebook Posting Button (New)
- **Direct Live Posting:** A gradient `🚀 انشر على فيسبوك الآن` button next to download.
- **Type Routing:** Automatically posts images to `/photos` and video reels to `/videos` with correct field mappings (`caption` vs `description`), utilizing the secure Facebook Page Access Token and Page ID.

### Custom Context Driver (Key Feature)
The **Custom Context TextBox** (`توجيهات أو سياق مخصص إضافي`) is the **primary driver**:
- Paste raw articles, news summaries, Gemini AI outputs, leaked details, or any raw text
- Leave the English Title field **completely blank** — the AI will auto-extract and synthesize a catchy title and its Arabic transliteration directly from the context
- The custom context bypasses web search and is passed directly as the primary source of truth to the AI

### Three Output Formats
| Format | Output | Dimensions | Duration |
|---|---|---|---|
| 🖼️ صورة غلاف | JPEG poster | 1254 × 1254 px | — |
| 🎬 ريل سريع (3ث) | MP4 static video | 1080 × 1080 px (1:1 square) | 3 seconds fixed |
| 🎬 ريل فيديو | MP4 Ken Burns video | 1080 × 1920 px (9:16 vertical) | 5–60 sec (slider) |

> **Quick Reel Note:** The 3-second quick reel renders the poster as a **static 1:1 square MP4** (no animation, no zoom/pan). It is separate from the standard reel system.
> **Standard Reel Note:** Uses FFMPEG with Ken Burns slow-zoom (`1.0 → 1.10 over totalFrames`). Duration is configurable via a premium slider (5–60 seconds).

### Facebook Post Caption Manager
A dedicated card below the live preview shows the **extended Facebook post caption** (500–1000 characters):
- Full Fusha Arabic narrative with paragraphs, context-awareness, and a CTA
- Fully editable textarea — word count + character count shown
- One-click **Copy to Clipboard** button with success toast notification
- The caption is a rephrased, extended version of the poster extract — NOT the same short text

### Dashboard UX
- **Floating Notification Toast** for success/error/info feedback
- **Live Preview** for both JPEG and MP4 outputs before download
- **Download Button** with correct file extension (`.jpg` for images, `.mp4` for reels)
- All text in RTL Arabic, UI labels bilingual (Arabic + English)

---

## API Endpoints

### `GET /api/mooviz/news`

| Action | Description |
|---|---|
| `?action=reddit` | Scrapes Google News RSS → enriches with Reddit+DDG → generates full Arabic post |
| `?action=custom&title=<query>&context=<text>` | Smart AI curation by query + optional custom context. If title is blank, context drives title synthesis |

**Response JSON:** `{ en, ar, genre, extract, caption, imageUrl }`
- `extract` — 180–240 char Arabic synopsis for the image poster
- `caption` — 500–1000 char extended Facebook post text with paragraphs and CTA

### `POST /api/mooviz`

**Body JSON:** `{ en, ar, genre, extract, imageUrl, type, duration }`

| `type` | Output |
|---|---|
| `image` | JPEG 1254×1254 |
| `quick_reel` | MP4 1080×1080 3-second static |
| `reel` | MP4 1080×1920 Ken Burns, custom duration |

---

## AI Pipeline Details

### Model Priority Order
1. **Gemini 2.0 Flash** — Primary (key rotation across up to 6 keys from `GOOGLE_AI_API_KEYS`)
2. **Groq Llama 3.3-70b** → fallback to Llama 3.1-70b → fallback to Llama3-70b-8192

### System Prompt Key Rules
1. **Transliteration Guard** — Bans literal translations, enforces phonetic/official names
2. **Query Respect** — Focuses on the ACTUAL news/controversy/leak, not generic synopsis
3. **Context Driver** — If title is empty/Custom Curation → extract title from custom context
4. **100% Pure Arabic** — No English words inside Arabic extract (prevents SVG rendering bugs)
5. **Length Controls** — extract: 180–240 chars · caption: 500–1000 chars
6. **Image Search Query** — AI generates a precise English query for the backdrop image fetch
7. **Engagement CTA** — Random Arabic CTA appended to caption if not already included

---

## Standalone Auto-Poster Files (`/var/dx7sport/auto-fb/`)

| File | Purpose |
|---|---|
| `index.mjs` | Main cron entry point (fetches live news, alternates image/reel, tracks state) |
| `reddit.mjs` | Reddit JSON scraper + Gemini AI verification, translation, structured data |
| `image-search.mjs` | High-quality image fetching via Wikimedia Commons and DuckDuckGo Images |
| `image.mjs` | 1254×1254 PNG backdrop, dark gradient, mooviz_hub.svg composite, Noto Kufi Arabic |
| `reel.mjs` | FFMPEG vertical video compile, Ken Burns slow-zoom (1.0 → 1.1) |
| `ai.mjs` | GoogleGenAI unified client with key rotation and cooldown management |
| `content.mjs` | Predefined 50 shows fallback catalog |
| `facebook.mjs` | Graph API multipart photo/video upload |
| `state.json` | Dedup list + daily counter + reel counter (auto-managed) |
| `log.txt` | Curation activity log |
| `run.sh` | Cron wrapper script |
| `mooviz_hub.svg` | Holographic Sci-Fi brand border frame overlay (transparent cutout center) |
| `fonts/` | `NotoKufiArabic-Variable.ttf` — used by Sharp and FFMPEG |

---

## Dependencies

| Dependency | Usage |
|---|---|
| `ffmpeg` | Video generation for reels |
| `sharp` | Image compositing + JPEG output |
| `Noto Kufi Arabic TTF` | Arabic typography (registered in VPS system fonts + explicit FFMPEG fontfile path) |

---

## Schedule (Autonomous Cron)

- **Frequency:** `0 */3 * * *` (every 3 hours)
- **Daily Limit:** Max 5 posts/day
- **Format Mix:** Alternates ~3 images + 2 reels per day
- **Dedup:** Tracked via `state.json` as `curated-{English_Subject_Name}` entries
