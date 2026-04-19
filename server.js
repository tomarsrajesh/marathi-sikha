const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── PUT YOUR API KEY HERE FOR LOCAL TESTING ───
const ANTHROPIC_API_KEY = 'sk-ant-api03-your-key-here';
// ───────────────────────────────────────────────

const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
};

async function handleTranslate(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { text } = JSON.parse(body);
      if (!text) { res.writeHead(400); res.end(JSON.stringify({ error: 'No text' })); return; }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: 'Translate English/Hindi/Hinglish to Marathi. Reply ONLY with raw JSON: {"marathi":"Devanagari sentence","roman":"Roman pronunciation","tip":"one short usage tip"}',
          messages: [{ role: 'user', content: text }]
        })
      });

      const data = await response.json();
      if (data.error) { res.writeHead(500); res.end(JSON.stringify({ error: data.error.message })); return; }

      const raw = data.content?.[0]?.text?.trim() || '';
      let obj;
      try { obj = JSON.parse(raw); }
      catch(e) { const m = raw.match(/\{[\s\S]*?\}/); obj = m ? JSON.parse(m[0]) : null; }

      if (!obj?.marathi) { res.writeHead(500); res.end(JSON.stringify({ error: 'Bad response' })); return; }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(obj));
    } catch(e) {
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // API route
  if (req.url === '/api/translate' && req.method === 'POST') {
    return handleTranslate(req, res);
  }

  // Static files
  let filePath = req.url === '/' ? '/public/index.html' : '/public' + req.url;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('\n✅ Marathi App running!');
  console.log('👉 Open in Chrome: http://localhost:' + PORT);
  console.log('\nPress Ctrl+C to stop.\n');
});
