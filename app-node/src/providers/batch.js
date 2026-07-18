// Shared batching + validation logic used by every AI provider.
// Keeps the translated array perfectly aligned with the input array so
// callers can map translations back onto bounding boxes / document runs.

const MAX_BATCH_ITEMS = 40;
const MAX_BATCH_CHARS = 6000;

function extractJsonArray(raw) {
  let text = String(raw).trim();
  // Strip markdown code fences some models add despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array');
  return parsed.map((v) => (v == null ? '' : String(v)));
}

function buildPrompt(texts, sourceLang, targetLang) {
  const system = [
    'You are a professional document translator.',
    `Translate each string in the given JSON array from ${sourceLang} to ${targetLang}.`,
    'Preserve meaning, tone, numbers, names, and any placeholders exactly.',
    'Keep line breaks inside a string as-is.',
    'Return ONLY a raw JSON array of translated strings, same length and same order as the input array.',
    'Do not add explanations, markdown fences, or extra keys.',
  ].join(' ');
  const user = JSON.stringify(texts);
  return { system, user };
}

function chunkTexts(texts) {
  const batches = [];
  let current = [];
  let currentChars = 0;
  for (const t of texts) {
    const len = (t || '').length;
    if (current.length && (current.length >= MAX_BATCH_ITEMS || currentChars + len > MAX_BATCH_CHARS)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(t);
    currentChars += len;
  }
  if (current.length) batches.push(current);
  return batches;
}

/**
 * Translates an array of strings preserving order/length.
 * @param {string[]} texts
 * @param {object} opts { sourceLang, targetLang }
 * @param {(system:string,user:string)=>Promise<string>} callRaw - provider-specific chat call returning raw text
 */
export async function translateTextArray(texts, opts, callRaw) {
  const { sourceLang, targetLang } = opts;
  const indices = texts
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t != null && String(x.t).trim() !== '');
  if (indices.length === 0) return texts.slice();

  const result = texts.slice();
  const batches = chunkTexts(indices.map((x) => x.t));
  let cursor = 0;

  for (const batch of batches) {
    const batchIndices = indices.slice(cursor, cursor + batch.length).map((x) => x.i);
    cursor += batch.length;
    const translated = await translateBatchWithRetry(batch, sourceLang, targetLang, callRaw);
    for (let k = 0; k < batchIndices.length; k++) {
      result[batchIndices[k]] = translated[k];
    }
  }
  return result;
}

async function translateBatchWithRetry(batch, sourceLang, targetLang, callRaw, depth = 0) {
  const { system, user } = buildPrompt(batch, sourceLang, targetLang);
  try {
    const raw = await callRaw(system, user);
    const arr = extractJsonArray(raw);
    if (arr.length === batch.length) return arr;
    throw new Error(`Length mismatch: expected ${batch.length}, got ${arr.length}`);
  } catch (err) {
    // Authentication/authorization/quota failures affect the whole job — no
    // amount of retrying or bisecting will fix a bad API key, so fail fast
    // with a clear message instead of silently returning untranslated text.
    const status = err.response?.status;
    const detailMsg =
      err.response?.data?.error?.message || err.response?.data?.message || '';
    // Gemini reports an invalid key as HTTP 400 API_KEY_INVALID rather than 401.
    const badKey400 = status === 400 && /api key/i.test(detailMsg);
    if (status === 401 || status === 403 || status === 429 || badKey400) {
      const detail = detailMsg || err.message;
      const reason = status === 429 ? 'Rate limit / quota exceeded' : 'Invalid or unauthorized API key';
      const fatal = new Error(`${reason} (HTTP ${status}): ${detail}`);
      fatal.fatal = true;
      throw fatal;
    }
    if (err.fatal) throw err;
    if (batch.length === 1) {
      // Last resort: return the original text untranslated rather than failing the whole job.
      if (depth >= 2) return batch;
      return translateBatchWithRetry(batch, sourceLang, targetLang, callRaw, depth + 1);
    }
    if (depth >= 2) {
      // Bisect to isolate failures instead of retrying the same failing batch forever.
      const mid = Math.ceil(batch.length / 2);
      const left = await translateBatchWithRetry(batch.slice(0, mid), sourceLang, targetLang, callRaw, 0);
      const right = await translateBatchWithRetry(batch.slice(mid), sourceLang, targetLang, callRaw, 0);
      return [...left, ...right];
    }
    return translateBatchWithRetry(batch, sourceLang, targetLang, callRaw, depth + 1);
  }
}
