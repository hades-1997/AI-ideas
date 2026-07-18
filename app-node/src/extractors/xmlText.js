// Low-level helpers shared by the DOCX in-place text-surgery code.

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function unescapeXml(str) {
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

// Matches both <w:t>text</w:t> and self-closing <w:t/> forms.
export const WT_REGEX = /<w:t(\s+[^>]*)?\/>|<w:t(\s+[^>]*)?>([\s\S]*?)<\/w:t>/g;

export function getRunTexts(xmlChunk) {
  const matches = [];
  let m;
  WT_REGEX.lastIndex = 0;
  while ((m = WT_REGEX.exec(xmlChunk)) !== null) {
    const inner = m[3] !== undefined ? m[3] : '';
    matches.push({ match: m[0], index: m.index, length: m[0].length, text: unescapeXml(inner) });
  }
  return matches;
}

/**
 * Replaces all <w:t> runs inside an XML chunk with a single translated string
 * placed in the first run; every other run in the chunk is emptied. Runs that
 * are not text (drawings, tabs, breaks, fields) are left completely untouched
 * because only the matched <w:t>...</w:t> spans are rewritten.
 */
export function applyTranslatedText(xmlChunk, translatedText) {
  const runs = getRunTexts(xmlChunk);
  if (runs.length === 0) return xmlChunk;

  let out = '';
  let cursor = 0;
  runs.forEach((run, i) => {
    out += xmlChunk.slice(cursor, run.index);
    if (i === 0) {
      out += `<w:t xml:space="preserve">${escapeXml(translatedText)}</w:t>`;
    } else {
      out += `<w:t xml:space="preserve"></w:t>`;
    }
    cursor = run.index + run.length;
  });
  out += xmlChunk.slice(cursor);
  return out;
}
