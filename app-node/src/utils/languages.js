// Shared language list for the UI, the AI translation prompts, and Tesseract OCR.
export const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect', tesseract: 'eng' },
  { code: 'en', name: 'English', tesseract: 'eng' },
  { code: 'vi', name: 'Vietnamese', tesseract: 'vie' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', tesseract: 'chi_sim' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', tesseract: 'chi_tra' },
  { code: 'ja', name: 'Japanese', tesseract: 'jpn' },
  { code: 'ko', name: 'Korean', tesseract: 'kor' },
  { code: 'fr', name: 'French', tesseract: 'fra' },
  { code: 'de', name: 'German', tesseract: 'deu' },
  { code: 'es', name: 'Spanish', tesseract: 'spa' },
  { code: 'pt', name: 'Portuguese', tesseract: 'por' },
  { code: 'it', name: 'Italian', tesseract: 'ita' },
  { code: 'ru', name: 'Russian', tesseract: 'rus' },
  { code: 'th', name: 'Thai', tesseract: 'tha' },
  { code: 'ar', name: 'Arabic', tesseract: 'ara' },
  { code: 'hi', name: 'Hindi', tesseract: 'hin' },
  { code: 'id', name: 'Indonesian', tesseract: 'ind' },
];

const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

export function languageName(code) {
  return byCode[code]?.name || code;
}

export function tesseractLang(code) {
  return byCode[code]?.tesseract || 'eng';
}
