import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';
const HF_API_KEY = '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';
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`Calling Ollama model: ${OLLAMA_MODEL}`);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `You are Sir Mark, a helpful and knowledgeable AI assistant. You answer questions on any topic with clarity and confidence. Be friendly, professional, and thorough in your responses.\n\nUser: ${message}\n\nAssistant:`,
        stream: false,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Ollama error:', error);
      return res.status(response.status).json({ error: error || 'Ollama error' });
    }

    const data = await response.json();
    const generatedText = data.response || 'No response generated';
    
    res.json({ response: generatedText.trim() });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/generate-quiz', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Using Ollama at ${OLLAMA_URL} with model ${OLLAMA_MODEL}`);
  console.log(`Hugging Face API proxy available at /api/generate-quiz`);
});
