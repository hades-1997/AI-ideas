import axios from 'axios';
import { translateTextArray } from './batch.js';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

async function callRaw(system, user, apiKey, model) {
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: model || DEFAULT_MODEL,
      max_tokens: 8192,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: user }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );
  const content = res.data?.content?.map((c) => c.text || '').join('');
  if (!content) throw new Error('Claude: empty response');
  return content;
}

export async function translateBlocks(texts, { sourceLang, targetLang, apiKey, model }) {
  if (!apiKey) throw new Error('Missing Anthropic API key');
  return translateTextArray(texts, { sourceLang, targetLang }, (system, user) =>
    callRaw(system, user, apiKey, model)
  );
}
