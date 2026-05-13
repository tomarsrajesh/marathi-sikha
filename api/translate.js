export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text || text.trim().length === 0) return res.status(400).json({ error: 'No text provided' });
  if (text.length > 500) return res.status(400).json({ error: 'Text too long (max 500 characters)' });

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
        max_tokens: 600,
        system: `You are a Marathi and Sanskrit language expert. Translate the user's input into BOTH Marathi and Sanskrit. The input may be in English, Hindi, Hinglish, or Hindi Devanagari script.

You MUST always provide translations for BOTH languages. Never leave Sanskrit empty.

Reply ONLY with this exact JSON format (no markdown, no extra text):
{
  "marathi": "Marathi sentence in Devanagari script",
  "marathi_roman": "Marathi pronunciation in Roman letters",
  "marathi_tip": "one short Marathi usage tip in English",
  "sanskrit": "Sanskrit sentence in Devanagari script",
  "sanskrit_roman": "Sanskrit pronunciation in Roman letters",
  "sanskrit_tip": "one short Sanskrit note in English"
}

Example for "I am happy":
{
  "marathi": "मला आनंद झाला आहे",
  "marathi_roman": "Mala aanand zhaala aahe",
  "marathi_tip": "Use झाले if you are female",
  "sanskrit": "अहम् प्रसन्नः अस्मि",
  "sanskrit_roman": "Aham prasannah asmi",
  "sanskrit_tip": "प्रसन्न means cheerful/pleased in Sanskrit"
}`,
        messages: [{ role: 'user', content: text.trim() }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = data.content?.[0]?.text?.trim() || '';

    let obj;
    try {
      // Try direct JSON parse first
      obj = JSON.parse(raw);
    } catch(e) {
      // Try extracting JSON from response
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try { obj = JSON.parse(m[0]); } catch(e2) { obj = null; }
      }
    }

    if (!obj || !obj.marathi) {
      return res.status(500).json({ error: 'Translation failed. Please try again.' });
    }

    // Ensure Sanskrit fields always have values
    if (!obj.sanskrit || obj.sanskrit === '' || obj.sanskrit === '—') {
      obj.sanskrit = obj.marathi; // fallback to Marathi if Sanskrit missing
      obj.sanskrit_roman = obj.marathi_roman || '';
      obj.sanskrit_tip = 'Sanskrit translation not available for this phrase';
    }

    return res.status(200).json(obj);

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
