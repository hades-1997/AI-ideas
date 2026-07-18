import axios from 'axios';
import { translateTextArray } from './batch.js';

const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function callRaw(system, user, apiKey, model) {
  const res = await axios.post(
    'https://api.deepseek.com/chat/completions',
    {
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  const content = res.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek: empty response');
  return content;
}

export async function translateBlocks(texts, { sourceLang, targetLang, apiKey, model }) {
  if (!apiKey) throw new Error('Missing DeepSeek API key');
  return translateTextArray(texts, { sourceLang, targetLang }, (system, user) =>
    callRaw(system, user, apiKey, model)
  );
}
