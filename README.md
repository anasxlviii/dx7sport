# Football Content Blog - Autonomous Article Generator

A fully autonomous content pipeline that converts Facebook posts into well-researched, fact-checked articles for your football blog.

## Features

- **Autonomous Pipeline**: Paste Facebook post content → AI generates researched articles
- **Fact-Checking**: Google Search API integration for verified sources
- **Custom CMS**: Full editorial control with admin dashboard
- **SEO Optimized**: Clean URLs, meta tags, and semantic structure
- **Ad Ready**: Pre-built ad placement zones for monetization
- **Responsive Design**: Mobile-friendly for your audience

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS
- **Database**: SQLite + Drizzle ORM
- **AI**: Google Gemini 2.0 Flash (Free tier)
- **Search**: Google Custom Search API (Free tier)
- **Hosting**: Vercel (ready)

## Prerequisites

Before you start, you need to get two Google API keys (both have free tiers):

### 1. Google AI API Key (Gemini 2.0 Flash)

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the key (starts with `AIza...`)
5. **Free tier**: 15 requests/minute

### 2. Google Search API Key

1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Search for "Custom Search API" and enable it
4. Go to APIs & Services → Credentials
5. Click "Create credentials" → API key
6. Copy the API key
7. **Create Custom Search Engine**:
   - Go to: https://programmablesearchengine.google.com/
   - Click "Add"
   - Enter any name and website (can use google.com for testing)
   - Select "Search the entire web"
   - Click "Create"
   - Go to Control Panel → Setup → Advanced
   - Copy the "Search engine ID" (CX)
8. **Free tier**: 100 searches/day

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Add your API keys:
   ```env
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   GOOGLE_SEARCH_API_KEY=your_search_api_key_here
   GOOGLE_SEARCH_CX=your_search_engine_id_here
   ADMIN_PASSWORD=your_admin_password
   ```

3. **Initialize the database**:
   ```bash
   npx drizzle-kit migrate
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   - Site: http://localhost:3000
   - Admin: http://localhost:3000/admin

## Usage

### Creating Articles Automatically

1. Go to http://localhost:3000/admin/new
2. Paste your Facebook post content
3. Optionally add the Facebook post URL
4. Click "Generate Article"
5. Wait for the pipeline to complete (30-60 seconds)
6. Review and edit the generated article
7. Publish when ready

### Manual Article Creation

1. Go to http://localhost:300/admin
2. Click "New Article"
3. Or use the API directly

### Managing Articles

- View all articles in the admin dashboard
- Edit any article before publishing
- Delete unwanted articles
- Track status (draft, published, archived)

## Deployment to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your repository
   - Add environment variables (GOOGLE_AI_API_KEY, GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_CX)
   - Click "Deploy"

3. **Note**: SQLite works locally. For production Vercel deployment, consider using:
   - Vercel Postgres (has free tier)
   - Turso (edge SQLite, free tier available)

To switch to Vercel Postgres:
1. Install: `npm install @vercel/postgres`
2. Update `lib/db/db.ts` to use Vercel Postgres
3. Update `drizzle.config.ts` dialect to "postgresql"

## Project Structure

```
football-blog/
├── app/
│   ├── admin/           # Admin dashboard & CMS
│   ├── api/             # API routes (pipeline, articles)
│   ├── article/         # Public article pages
│   └── category/        # Category pages
├── lib/
│   ├── pipeline/        # Automation pipeline
│   │   ├── extract-topic.ts      # AI topic extraction
│   │   ├── deep-search.ts        # Google Search integration
│   │   ├── generate-article.ts   # AI article generation
│   │   └── pipeline.ts           # Orchestrator
│   ├── db/             # Database schema & connection
│   └── ai/             # AI client wrappers
└── components/         # React components
```

## Customization

### Add Your Branding

Edit `components/Header.tsx` to change the site name and logo.

### Configure Ad Zones

Ad placement zones are in:
- `app/article/[slug]/page.tsx` - In-article ad space
- `app/article/[slug]/page.tsx` - Sidebar ad space
- `app/page.tsx` - Homepage ad opportunities

Add your AdSense or ad network code where you see "Advertisement Space" comments.

### Adjust Article Generation

Edit `lib/pipeline/generate-article.ts` to customize:
- Article length
- Writing style
- Section structure
- Fact box format

## Troubleshooting

**Pipeline errors**:
- Check API keys are correct in `.env`
- Verify Google Search quota (100/day free)
- Check Gemini quota (15 req/min free)

**Database errors**:
- Run `npx drizzle-kit migrate` again
- Delete `football-blog.db` and re-run migrations

**Build errors**:
- Run `npm run build` to see specific errors
- Check TypeScript types: `npx tsc --noEmit`

## Roadmap

Future enhancements to consider:
- Facebook API integration for automatic post fetching
- Image generation for article thumbnails
- Multi-language support (French, Arabic)
- Social media auto-posting
- Analytics dashboard
- Comments system

## License

MIT

## Support

For issues or questions, check the plan file at:
`C:\Users\asus\.claude\plans\purrfect-floating-bunny.md`
