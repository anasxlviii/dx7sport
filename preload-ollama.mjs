import http from 'node:http';

const data = JSON.stringify({
  model: 'gemma2:2b',
  messages: [{ role: 'user', content: 'warmup' }],
  stream: false,
  keep_alive: '60m',
});

const req = http.request('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  timeout: 300000,
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const d = JSON.parse(body);
    console.log('PRELOADED:', d.message ? 'yes' : 'no');
    process.exit(0);
  });
});
req.on('timeout', () => { req.destroy(); console.log('PRELOAD_TIMEOUT'); process.exit(1); });
req.on('error', (e) => { console.log('PRELOAD_ERR:', e.message); process.exit(1); });
req.write(data);
req.end();
