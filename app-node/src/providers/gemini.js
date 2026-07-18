import axios from 'axios';
import { translateTextArray } from './batch.js';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function callRaw(system, user, apiKey, model) {
  const m = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
  const res = await axios.post(
    url,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  const content = res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
  if (!content) throw new Error('Gemini: empty response');
  return content;
}

export async function translateBlocks(texts, { sourceLang, targetLang, apiKey, model }) {
  if (!apiKey) throw new Error('Missing Gemini API key');
  return translateTextArray(texts, { sourceLang, targetLang }, (system, user) =>
    callRaw(system, user, apiKey, model)
  );
}
