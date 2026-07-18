import axios from 'axios';
import { translateTextArray } from './batch.js';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function callRaw(system, user, apiKey, model) {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  const content = res.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI: empty response');
  return content;
}

// OpenAI's json_object mode requires a JSON *object*, not a bare array, so we
// wrap/unwrap under an "items" key transparently for this provider only.
function wrapSystem(system) {
  return system.replace(
    'Return ONLY a raw JSON array of translated strings, same length and same order as the input array.',
    'Return ONLY a JSON object of the form {"items": [...]} containing the translated strings, same length and same order as the input array.'
  );
}

function unwrapItems(raw) {
  try {
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.items)) return JSON.stringify(obj.items);
  } catch {
    // fall through, let downstream JSON-array extraction try raw text
  }
  return raw;
}

export async function translateBlocks(texts, { sourceLang, targetLang, apiKey, model }) {
  if (!apiKey) throw new Error('Missing OpenAI API key');
  return translateTextArray(texts, { sourceLang, targetLang }, async (system, user) => {
    const raw = await callRaw(wrapSystem(system), user, apiKey, model);
    return unwrapItems(raw);
  });
}
