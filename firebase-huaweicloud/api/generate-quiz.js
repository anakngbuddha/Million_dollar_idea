const HF_API_KEY = process.env.HF_API_KEY || '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';
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Calling Hugging Face API for quiz generation...');

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      return res.status(response.status).json({ error: errorText || 'Hugging Face API error' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    res.json({ text });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
