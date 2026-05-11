# DX7 SPORT - Handover Document (May 2026)

## 1. Project Overview
**DX7 SPORT** is a professional, autonomous football news and entertainment platform. It features an automated content pipeline ("Ghost Reporter"), live match results, and interactive gaming features (Quizzes, Crosswords). The platform is designed for high visual impact, dark-mode aesthetics (Lime/Zinc/Black), and full operational autonomy.

---

## 2. Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI/Styling**: React 19 + Tailwind CSS 4 + Lucide Icons
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **AI Engine**: Google Gemini 2.0 Flash (via `@google/genai` — new unified SDK)
- **Search**: DuckDuckGo Search (for live context)
- **Data Source**: TheSportsDB API (for scores and team/league assets)
- **Communication**: WhatsApp & Telegram Bot integration

---

## 3. Credentials & API Keys
### Admin Access
- **URL**: `/admin`
- **Username**: read from `ADMIN_USERNAME` env var
- **Password**: read from `ADMIN_PASSWORD` env var
- *Credentials are now fully environment-driven — no hardcoded secrets in source code.*

### Environment Variables (`.env`)
| Variable | Purpose |
| :--- | :--- |
| `GOOGLE_AI_API_KEYS` | Comma-separated list of Gemini API keys for rotation. Smart per-key cooldowns + exponential backoff. |
| `ADMIN_USERNAME` | Admin panel username (was previously hardcoded). |
| `ADMIN_PASSWORD` | Admin panel password (was previously hardcoded). |
| `DATABASE_URL` | Supabase/PostgreSQL connection string. |
| `PIPELINE_SECRET` | Secret key for triggering the autonomous pipeline. |
| `TELEGRAM_BOT_TOKEN` | Token for the Telegram bot. |
| `TELEGRAM_CHAT_ID` | Comma-separated IDs for target Telegram channels/users. |
| `WHATSAPP_PHONE` | Target WhatsApp number for notifications. |

---

## 4. Architecture & Key Modules

### A. The "Ghost Reporter" (Autonomous Pipeline)
- **Core logic**: `lib/pipeline/autonomous.ts`
- **Article Generation**: `lib/pipeline/generate-article.ts`
- **AI Infrastructure**: `lib/pipeline/ai-client.ts` (Unified Client)
  - **Multi-Provider Support**: Automatically switches between **Groq**, **OpenRouter**, and **Gemini** (free rotation).
  - **High Throughput**: Integrated **Groq** (Llama 3.1 70B) for 10x faster generation and enterprise-grade rate limits.
  - **Fallback**: Intelligent fallback to OpenRouter or Gemini rotation if the preferred provider fails.
  - **Configuration**: Use `PREFERRED_AI_PROVIDER` and `GROQ_API_KEY` / `OPENROUTER_API_KEY` in `.env`.
- **Function**: Automatically fetches trending topics, searches for live news via DuckDuckGo, and uses AI to write 1200-1500 word in-depth articles in Fusha Arabic with Western numerals.

### B. Scores Center
- **Module**: `lib/pipeline/sportsdb.ts` & `components/ScoreSection.tsx`
- **Features**: Fetches results for **10 leagues**: Big 5 + UCL + Europa League + Conference League + Saudi Pro League + MLS. Official league badges for all leagues.
- **Live Polish**: Updates every 5 minutes and intelligently transitions to the next day's schedule.

### C. Gaming Engine (Entertainment)
- **Renderer**: `components/QuizRenderer.tsx`
- **Types**:
  1. **Guess the Player/Team**: Uses club logos (`clueLogos`) as transfer history clues. Anti-Spoiler blurring. Difficulty badge per question (Easy → Expert). 🔥 Streak counter with animation.
  2. **Crossword**: Real cell-by-cell validation with green/red color feedback. Score display after checking. No more browser `alert()`.
- **Generation**: Prompted in `generate-article.ts` to produce 15+ levels of increasing difficulty.

---

## 5. Recent Accomplishments (May 2026 Updates — Latest)
- **AI Client Overhaul**: Migrated entire codebase from `@google/generative-ai` (old SDK) to `@google/genai` (new SDK). This resolved false "API keys exhausted" errors caused by incompatible SDK mixing.
- **Smart Key Rotation**: Per-key cooldown tracking, exponential backoff, handles 429 + 503 errors.
- **Security**: Admin credentials moved from hardcoded source code to environment variables.
- **League Expansion**: Scores center now covers 10 leagues (added Europa, Conference, Saudi Pro, MLS).
- **Ghost Reporter Expanded**: Now sweeps all Big 5 + UCL + 5 search queries per run.
- **Gaming Engine**: Crossword has real validation UI. Quiz has difficulty tiers and streak counter.

### Previous Accomplishments (Early May 2026)
- **Professionalization**: Updated branding from 7DX to **DX7**.
- **Data Expansion**: Comprehensive match result aggregation (unlimited games per league).
- **Visual Branding**: Integrated high-quality league badges in the Score Section.
- **Gaming Upgrade**: Overhauled the quiz UI for a premium feel, added transfer history logic, and enforced a "No Spoiler" image rule.
- **Logging**: Implemented `PipelineLogModal` in the admin panel to track autonomous generation results.

---

## 6. How to Handle Future Tasks
1. **Adding Leagues**: Add the league ID to `TOP_LEAGUES` in `lib/pipeline/sportsdb.ts`, add the badge URL to `LEAGUE_BADGES`, and include the ID in `featuredLeagues` array in `getTopLeaguesScores()`.
2. **Refining AI**: The system prompt in `generate-article.ts` is the "brain" of the platform. Modify it to change article length, tone, or game logic.
3. **Admin Controls**: Use `/admin` to trigger the pipeline manually or view operational logs.
4. **Numeral Consistency**: Always ensure the `dxt-numeral` class or the `numberingSystem: 'latn'` locale option is used to maintain Western numerals (0-9).
5. **Adding API Keys**: Add more Gemini keys to `GOOGLE_AI_API_KEYS` (comma-separated). Each key gets its own independent cooldown — the system will automatically use the next available one.

---

## 7. Contact & Reference
- **Brand Identity**: DX7 SPORT
- **Owner**: Anas
- **Main Developer**: Antigravity (AI Assistant)
