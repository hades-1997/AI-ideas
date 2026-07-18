import { getProvider, resolveApiKey } from '../providers/index.js';
import { languageName } from '../utils/languages.js';

export async function translateTexts(texts, { provider, apiKey, model, sourceLang, targetLang }) {
  const key = resolveApiKey(provider, apiKey);
  if (!key) {
    throw new Error(
      `No API key configured for "${provider}". Provide one in the request or set it in the server .env file.`
    );
  }
  const impl = getProvider(provider);
  const sourceName = sourceLang === 'auto' ? 'the source language (auto-detect)' : languageName(sourceLang);
  const targetName = languageName(targetLang);
  return impl.translateBlocks(texts, { sourceLang: sourceName, targetLang: targetName, apiKey: key, model });
}
