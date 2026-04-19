export default async function handler(req, res) {
  // Allow requests from your website only
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'Text too long (max 500 characters)' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `You are a Marathi language expert and translator.
The user may write in ANY of these forms:
- English (e.g. "I am hungry")
- Hindi in Roman script / Hinglish (e.g. "mujhe bhook lagi hai")
- Hindi in Devanagari script (e.g. "मुझे भूख लगी है")
- Mixed Hindi-English (e.g. "अरे भाई सुनो ना")

IMPORTANT: Even if the input is already in Devanagari script, it may be HINDI — not Marathi. You must ALWAYS convert and translate it into proper conversational MARATHI.

For example:
- "अरे भाई सुनो ना" is Hindi → correct Marathi is "अरे भावा, नीट ऐक"
- "मुझे पानी चाहिए" is Hindi → correct Marathi is "मला पाणी हवे आहे"
- "मैं थक गया हूं" is Hindi → correct Marathi is "मी थकलो आहे"

Always output natural, conversational Marathi that a native speaker would actually use.
Reply ONLY with raw JSON, no markdown, no explanation:
{"marathi":"correct Marathi sentence in Devanagari script","roman":"pronunciation in simple Roman/English letters","tip":"one short helpful usage tip in English"}`,
        messages: [{ role: 'user', content: text.trim() }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = data.content?.[0]?.text?.trim() || '';
    let obj;
    try { obj = JSON.parse(raw); }
    catch(e) {
      const m = raw.match(/\{[\s\S]*?\}/);
      obj = m ? JSON.parse(m[0]) : null;
    }

    if (!obj || !obj.marathi) return res.status(500).json({ error: 'Translation failed. Please try again.' });
    return res.status(200).json(obj);

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
