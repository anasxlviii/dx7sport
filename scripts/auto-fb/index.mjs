import { generateImage } from './image.mjs'
import { generateReel } from './reel.mjs'
import { postToFacebook } from './facebook.mjs'
import { getRandomShow, fetchShowSummary } from './content.mjs'
import { getLiveRedditNews } from './reddit.mjs'
import { readFileSync, writeFileSync, existsSync, appendFileSync, unlinkSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const DIR = dirname(fileURLToPath(import.meta.url))
const STATE_FILE = join(DIR, 'state.json')
const LOG_FILE = join(DIR, 'log.txt')
const TMP_DIR = join(DIR, 'tmp')

const FB_PAGE_ID = process.env.FB_PAGE_ID
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  try { appendFileSync(LOG_FILE, line + '\n') } catch {}
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { posted: [], count: 0, today: '', reelCount: 0 }
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
}

function saveState(s) {
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

async function main() {
  log('=== Start Curation Cycle ===')
  if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
    log('ERROR: FB_PAGE_ID and FB_ACCESS_TOKEN required in .env')
    process.exit(1)
  }

  const state = loadState()
  if (state.enabled === false) {
    log('Agent is currently DISABLED in state.json, skipping curation cycle.')
    return
  }

  const today = new Date().toISOString().slice(0, 10)

  if (state.today !== today) {
    state.today = today
    state.count = 0
    state.reelCount = 0
  }
  if (state.count >= 5) {
    log(`Already posted ${state.count} times today, skipping.`)
    return
  }

  const postNum = state.count + 1
  const isReelPost = (postNum % 3 === 0)

  log(`Post #${postNum}/5 today — ${isReelPost ? 'REEL' : 'IMAGE'}`)

  let postData = null

  // 1. Try to fetch live, fact-checked Reddit news
  try {
    log('Attempting to fetch live trending controversial news from Reddit...')
    postData = await getLiveRedditNews()
  } catch (err) {
    log(`Reddit pipeline encountered error: ${err.message}`)
  }

  // 2. Fall back to predefined shows catalog if Reddit fetch fails or returned null
  if (!postData) {
    log('Falling back to selecting a random predefined show from catalog...')
    const show = getRandomShow()
    const pageId = `show-${show.en.replace(/\s+/g, '_')}`

    if (state.posted.includes(pageId)) {
      log(`Predefined show duplicate: ${show.en}, will retry next cycle.`)
      return
    }

    log(`Selected: ${show.en} (${show.ar}) — ${show.genre}`)
    log('Fetching from Wikipedia...')
    let article
    try {
      article = await fetchShowSummary(show)
    } catch (e) {
      log(`Wiki fallback error for ${show.en}: ${e.message}`)
      return
    }

    const extract = article.extract || article.description || ''
    const imageUrl = article.imageUrl

    postData = {
      en: show.en,
      ar: show.ar,
      genre: show.genre,
      extract,
      imageUrl
    }
  }

  log(`Post content successfully curated! subject: "${postData.en}" (${postData.ar})`)
  
  const hashtags = `#${postData.genre} #MoovizHub #مسلسلات #أفلام #أخبار_المشاهير`
  const caption = `${postData.ar} (${postData.en})\n\n${postData.extract.slice(0, 450)}\n\n${hashtags}`

  if (isReelPost) {
    try {
      if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })
      log('Generating video reel (30s vertical)...')
      const reelPath = join(TMP_DIR, `reel_${Date.now()}.mp4`)
      await generateReel(postData, reelPath)
      const reelBuf = readFileSync(reelPath)
      log(`Reel successfully compiled: ${reelBuf.length} bytes`)

      log('Uploading reel to Facebook Page...')
      const result = await postToFacebook(reelBuf, caption, FB_PAGE_ID, FB_ACCESS_TOKEN)
      log(`Reel successfully posted! ID: ${result.id}`)
      state.reelCount++
      try { unlinkSync(reelPath) } catch {}
    } catch (e) {
      log(`Reel compilation/posting failed: ${e.message}, falling back to image...`)
      const img = await generateImage(postData)
      log(`Image fallback compiled: ${img.length} bytes`)
      const result = await postToFacebook(img, caption, FB_PAGE_ID, FB_ACCESS_TOKEN)
      log(`Image fallback posted! ID: ${result.id}`)
    }
  } else {
    try {
      log('Generating poster image...')
      const img = await generateImage(postData)
      log(`Image successfully compiled: ${img.length} bytes`)

      log('Uploading image to Facebook Page...')
      const result = await postToFacebook(img, caption, FB_PAGE_ID, FB_ACCESS_TOKEN)
      log(`Image successfully posted! ID: ${result.id}`)
    } catch (e) {
      log(`Image posting failed: ${e.message}`)
      return
    }
  }

  // De-dup tracking
  const uniqueId = `curated-${postData.en.replace(/\s+/g, '_')}`
  state.posted.push(uniqueId)
  if (state.posted.length > 500) state.posted = state.posted.slice(-500)
  
  state.count++
  saveState(state)
  log('=== Curation Cycle Done ===')
}

main().catch(e => log('FATAL ERROR: ' + e.message))
