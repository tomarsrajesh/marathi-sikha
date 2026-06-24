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
        max_tokens: 500,
        system: `You are an English language expert and grammar teacher. The user will give you a sentence that may be in:
- Broken/incorrect English (wrong grammar, wrong tense, wrong word order)
- Hindi (Devanagari or Roman script / Hinglish)
- Marathi (Devanagari script)
- Any mix of the above

Your job:
1. Understand what the person means, regardless of the language or grammar mistakes.
2. Convert it into a single, natural, grammatically correct English sentence — the way a fluent native English speaker would say it.
3. Briefly explain what was corrected (grammar, tense, word order, spelling) in simple, friendly language. If the input was already in another language (Hindi/Marathi), just say "Translated from Hindi/Marathi to English" instead of listing grammar errors.

Reply ONLY with raw JSON, no markdown, no extra text:
{
  "original": "exactly what the user typed, unchanged",
  "corrected": "the corrected, fluent English sentence",
  "changes": "a short, friendly explanation of what was fixed or translated"
}

Examples:

Input: "he is go to market yesterday"
Output: {"original":"he is go to market yesterday","corrected":"He went to the market yesterday.","changes":"Fixed verb tense — used past tense 'went' instead of 'is go' since the action happened yesterday."}

Input: "mai office ja raha tha"
Output: {"original":"mai office ja raha tha","corrected":"I was going to the office.","changes":"Translated from Hinglish to English — 'ja raha tha' means 'was going' in past continuous tense."}

Input: "मी काल शाळेत गेलो"
Output: {"original":"मी काल शाळेत गेलो","corrected":"I went to school yesterday.","changes":"Translated from Marathi to English."}

Input: "she don't like this food"
Output: {"original":"she don't like this food","corrected":"She doesn't like this food.","changes":"Fixed subject-verb agreement — use 'doesn't' (not 'don't') with 'she'."}`,
        messages: [{ role: 'user', content: text.trim() }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = data.content?.[0]?.text?.trim() || '';

    let obj;
    try {
      obj = JSON.parse(raw);
    } catch(e) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { obj = JSON.parse(m[0]); } catch(e2) { obj = null; } }
    }

    if (!obj || !obj.corrected) {
      return res.status(500).json({ error: 'Correction failed. Please try again.' });
    }

    if (!obj.original) obj.original = text.trim();
    if (!obj.changes) obj.changes = 'Converted to correct English.';

    return res.status(200).json(obj);

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
