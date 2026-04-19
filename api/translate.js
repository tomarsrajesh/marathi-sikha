export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: 'Translate English/Hindi/Hinglish to Marathi. Reply ONLY with raw JSON, no markdown: {"marathi":"Devanagari sentence","roman":"pronunciation in Roman letters","tip":"one short usage tip"}',
        messages: [{ role: 'user', content: text }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.content?.[0]?.text?.trim() || '';
    let obj;
    try { obj = JSON.parse(raw); }
    catch(e) {
      const m = raw.match(/\{[\s\S]*?\}/);
      obj = m ? JSON.parse(m[0]) : null;
    }

    if (!obj?.marathi) return res.status(500).json({ error: 'Translation failed' });
    return res.status(200).json(obj);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
