# DX7 SPORT | Project Documentation & Technical Overview

## 1. Project Mission
DX7 Sport is a premium, high-performance football intelligence platform designed for autonomous content generation. It combines tactical analysis, transfer news, and interactive gaming (quizzes/crosswords) into a sleek, "Dark/Lime" aesthetic.

---

## 2. Core Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS 4 (Vanilla CSS variables for tokens)
- **AI Engine**: Google Gemini 2.0 / Groq (Llama 3)
- **Deployment**: Vercel (Standard Node.js Runtime)

---

## 3. Architecture & System Design

### A. The Autonomous Editorial Pipeline (`lib/pipeline/`)
This is the "Ghost Reporter" system that generates content without human intervention:
1. **Topic Extraction**: Scrapes news aggregators to find trending football topics.
2. **Deep Search**: Uses DuckDuckGo to gather real-time context and tactical data.
3. **Fact-Checking**: Cross-references data against official sources (TheSportsDB).
4. **AI Generation**: Gemini 2.0 Pro generates 2000+ word tactical articles in sophisticated Fusha Arabic.
5. **Image Retrieval**: Selects the best contextual image via a custom AI-driven search utility.
6. **Publishing**: Commits the article to the database with SEO metadata and localized slugging.

### B. Database Schema (`lib/db/schema.ts`)
- **Articles**: Stores the full content, metadata (JSON for quizzes/fact-boxes), and state.
- **Settings**: Key-value store for global configurations (Ads, SEO, Pipeline toggles).
- **Media**: References to internal/external assets.
- **Scores**: Cached match data from TheSportsDB.

### C. UI/UX & Design System
- **Theme**: High-contrast black background with Lime Green (`#9EFF00`) accents.
- **Components**:
    - `ArticleRenderer`: Handles complex markdown with auto-injected galleries and ads.
    - `QuizRenderer`: Interactive gaming engine for "Guess the Player/Team".
    - `ScoreSection`: Real-time score ticker with "Live" status indicators.
- **Typography**: Cairo (Arabic) and Geist (Latin) for a modern, sharp feel.

---

## 4. Critical Infrastructure Decisions (Knowledge for the next Agent)

### Node.js vs. Edge Runtime
**IMPORTANT**: The project MUST use the standard **Node.js runtime** for any file interacting with the database.
- **Why?** The `postgres` library used for connection pooling depends on `perf_hooks`, which is not available in the Vercel Edge Runtime.
- **Fix**: All pages/routes needing DB access must export `export const runtime = 'nodejs';`.

### Build & Asset Handling
1. **Image Optimization**: `next/image` is configured to allow `images.unsplash.com`. However, many articles pull from diverse web sources. Use `unoptimized={true}` in `next/image` for dynamic URLs to prevent build-time resolution errors.
2. **Standardized Assets**: All internal branding (logos, icons) is standardized to **WebP** for performance.
3. **Directive Order**: `use client` must ALWAYS be the absolute first line in a file. The `scripts/fix-directives.js` utility can be used to repair this if automated tools break the order.

### Ad Management
The site uses a custom `Adsterra` integration:
- Managed via `/admin/ads`.
- Supports both **Direct Injection** (Pop-unders) and **Iframe Isolation** (Banners) to protect the main thread performance.

---

## 5. Security & Safety Filters
The project contains hardcoded filters to maintain editorial alignment:
- **Exclusion Rule**: Any content related to Israeli clubs, leagues, or national teams is programmatically excluded from both the scraping pipeline and the manual search results.

---

## 6. Directory Map
- `/app`: Pages and API routes (Next.js App Router).
- `/components`: Reusable UI elements and specialized renderers.
- `/lib/pipeline`: The backend logic for AI and data fetching.
- `/lib/db`: Database connection and schema definitions.
- `/public`: Static assets (WebP logos, Hero images).
- `/scripts`: Utility scripts for maintenance and build fixes.

---

## 7. How to Operate
- **Trigger Pipeline**: POST to `/api/pipeline` or use the Admin UI at `/admin/new`.
- **Database Migrations**: Managed via `drizzle-kit`. Run `pnpm drizzle-kit push` for schema updates.
- **Deployment**: Standard `git push` to Vercel. Ensure all Environment Variables (`DATABASE_URL`, `GOOGLE_AI_API_KEY`) are mirrored in the Vercel Dashboard.
