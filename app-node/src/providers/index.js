import * as openai from './openai.js';
import * as gemini from './gemini.js';
import * as claude from './claude.js';
import * as deepseek from './deepseek.js';

const PROVIDERS = { openai, gemini, claude, deepseek };

export const PROVIDER_NAMES = Object.keys(PROVIDERS);

const ENV_KEY = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  claude: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
};

export function getProvider(name) {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(`Unknown AI provider "${name}". Valid options: ${PROVIDER_NAMES.join(', ')}`);
  }
  return provider;
}

export function resolveApiKey(name, requestApiKey) {
  return requestApiKey || process.env[ENV_KEY[name]] || null;
}
