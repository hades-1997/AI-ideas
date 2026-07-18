import JSZip from 'jszip';
import { getRunTexts, applyTranslatedText } from './xmlText.js';

// Paragraphs never nest in OOXML, so a non-greedy match of <w:p ...>...</w:p>
// safely delimits each one, including paragraphs inside table cells.
const PARA_REGEX = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;

const TARGET_FILE_RE = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;

function splitParagraphs(xml) {
  const blocks = [];
  let cursor = 0;
  let m;
  PARA_REGEX.lastIndex = 0;
  while ((m = PARA_REGEX.exec(xml)) !== null) {
    if (m.index > cursor) blocks.push({ isParagraph: false, text: xml.slice(cursor, m.index) });
    blocks.push({ isParagraph: true, text: m[0] });
    cursor = m.index + m[0].length;
  }
  if (cursor < xml.length) blocks.push({ isParagraph: false, text: xml.slice(cursor) });
  return blocks;
}

function paragraphText(paraXml) {
  return getRunTexts(paraXml)
    .map((r) => r.text)
    .join('');
}

/**
 * Opens a .docx buffer for in-place translation. Only <w:t> text-node
 * contents are ever modified; every other byte of every XML part (styles,
 * numbering, images, tables, section properties, etc.) is preserved exactly,
 * which is what keeps the original layout/formatting intact.
 */
export async function openDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const files = Object.keys(zip.files).filter((name) => TARGET_FILE_RE.test(name) && !zip.files[name].dir);

  const fileEntries = [];
  const blocks = []; // { fileIndex, paraIndex, text }

  for (let fi = 0; fi < files.length; fi++) {
    const xml = await zip.file(files[fi]).async('string');
    const parts = splitParagraphs(xml);
    fileEntries.push({ name: files[fi], parts });
    parts.forEach((part, pi) => {
      if (!part.isParagraph) return;
      const text = paragraphText(part.text);
      if (text.trim() !== '') {
        blocks.push({ fileIndex: fi, partIndex: pi, text });
      }
    });
  }

  return {
    /** Plain array of translatable strings, in document order. */
    getBlocks() {
      return blocks.map((b) => b.text);
    },

    /** Approximate style-aware blocks, useful for cross-format layout (DOCX -> PDF/Image). */
    getStyledBlocks() {
      return blocks.map((b) => {
        const paraXml = fileEntries[b.fileIndex].parts[b.partIndex].text;
        const bold = /<w:b\/>|<w:b\s+w:val="(true|1)"/.test(paraXml);
        const italic = /<w:i\/>|<w:i\s+w:val="(true|1)"/.test(paraXml);
        const sizeMatch = paraXml.match(/<w:sz\s+w:val="(\d+)"/);
        const fontSize = sizeMatch ? parseInt(sizeMatch[1], 10) / 2 : 11; // half-points -> points
        const isHeading = /<w:pStyle\s+w:val="Heading/i.test(paraXml);
        return { text: b.text, bold: bold || isHeading, italic, fontSize: isHeading ? fontSize + 4 : fontSize };
      });
    },

    /**
     * Applies translated strings (same order/length as getBlocks()) and
     * returns a new .docx Buffer.
     */
    async build(translatedTexts) {
      if (translatedTexts.length !== blocks.length) {
        throw new Error('Translated block count does not match extracted block count');
      }
      blocks.forEach((b, i) => {
        const part = fileEntries[b.fileIndex].parts[b.partIndex];
        part.text = applyTranslatedText(part.text, translatedTexts[i]);
      });
      for (const entry of fileEntries) {
        const newXml = entry.parts.map((p) => p.text).join('');
        zip.file(entry.name, newXml);
      }
      return zip.generateAsync({ type: 'nodebuffer' });
    },
  };
}
