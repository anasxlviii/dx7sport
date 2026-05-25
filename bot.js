const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

process.stdout._handle?.setBlocking(true);
process.stderr._handle?.setBlocking(true);

const HIST_DIR = '/opt/opencode-bot/history';
const MAX_HIST = 5;
try { fs.mkdirSync(HIST_DIR, { recursive: true }); } catch {}

function loadHistory(chatId) {
  try {
    const p = path.join(HIST_DIR, chatId + '.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return []; }
}

function saveHistory(chatId, msgs) {
  try {
    const slim = msgs.slice(-MAX_HIST * 2);
    fs.writeFileSync(path.join(HIST_DIR, chatId + '.json'), JSON.stringify(slim));
  } catch {}
}

const TOKEN = '8551223711:AAFZ0VhuIcE0z9JPPXag3umyUkARoD188XY';
const ALLOWED_USER = 8271912165;
const BASE = 'https://api.telegram.org/bot' + TOKEN;
const MODEL = 'opencode/qwen3.6-plus-free';
const SYS = 'You are my personal assistant. Talk to me naturally like a real person. No markdown, no lists, no bullet points, no code blocks. Just natural casual conversation. Default language is English. Only respond in Arabic when I explicitly ask you to.';
let offset = 0;

function api(method, payload) {
  return new Promise((resolve, reject) => {
    const isPost = !!payload;
    const url = BASE + '/' + method + (isPost ? '' : '?offset=' + offset + '&timeout=0');
    const u = new URL(url);
    const data = isPost ? JSON.stringify(payload) : '';
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: isPost ? 'POST' : 'GET',
      headers: isPost ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {},
      timeout: 10000,
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error(body)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;
  if (Number(msg.from.id) !== ALLOWED_USER) return;
  offset = Math.max(offset, update.update_id + 1);

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  if (!text) return;

  console.log('Processing from', msg.from.id, ':', text.substring(0, 80));
  api('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

  const history = loadHistory(chatId);
  const histText = history.map(h => (h.role === 'user' ? 'User: ' : 'Assistant: ') + h.text).join('\n');
  const fullSys = SYS + (histText ? '\n\nRecent conversation:\n' + histText : '');

  try {
    const escaped = text.replace(/'/g, "'\\''");
    const sysEscaped = fullSys.replace(/'/g, "'\\''");
    const cmd = "cd /var/dx7sport && /usr/bin/opencode run --pure --model " + MODEL + " '" + sysEscaped + "' '" + escaped + "' 2>/dev/null </dev/null";
    const result = execSync(cmd, { timeout: 120000, maxBuffer: 2 * 1024 * 1024 });
    let reply = result.toString().trim();
    if (!reply) reply = '(done)';
    if (reply.length > 4000) reply = reply.substring(0, 3997) + '...';
    history.push({ role: 'user', text: text.substring(0, 500) });
    history.push({ role: 'assistant', text: reply.substring(0, 500) });
    saveHistory(chatId, history);
    await api('sendMessage', { chat_id: chatId, text: reply });
  } catch (err) {
    const short = (err.message || String(err)).substring(0, 500);
    history.push({ role: 'user', text: text.substring(0, 500) });
    history.push({ role: 'assistant', text: '[Error] ' + short });
    saveHistory(chatId, history);
    await api('sendMessage', { chat_id: chatId, text: short });
  }
}

async function poll() {
  while (true) {
    try {
      process.stdout.write('.');
      const data = await api('getUpdates');
      if (data.ok && data.result) {
        for (const update of data.result) {
          await handleUpdate(update);
        }
      }
    } catch (e) {
      console.error("Polling error:", e.message);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

console.log('Bot started at', new Date().toISOString());
poll().catch((e) => console.error('Fatal:', e.message));
