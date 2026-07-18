import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { measureTextWidth } from '../utils/fonts.js';

// Keep Tesseract's downloaded language trained-data files out of the project
// root (its default cache location is the current working directory).
const CACHE_PATH = fileURLToPath(new URL('../../.tesseract-cache/', import.meta.url));
mkdirSync(CACHE_PATH, { recursive: true });

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function flattenLines(data) {
  const lines = [];
  for (const block of data.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        const text = (line.text || '').replace(/\s+$/, '');
        if (!text.trim()) continue;
        const rowHeight = line.rowAttributes?.rowHeight || line.bbox.y1 - line.bbox.y0;
        lines.push({
          text,
          x0: line.bbox.x0,
          y0: line.bbox.y0,
          x1: line.bbox.x1,
          y1: line.bbox.y1,
          fontSize: rowHeight,
          baselineY: line.baseline?.y0 ?? line.bbox.y1 - rowHeight * 0.15,
        });
      }
    }
  }
  return lines;
}

/**
 * OCRs an image and returns a handle to extract translatable line text and
 * rebuild an image with translated text overlaid in place of the original.
 */
export async function openImage(buffer, { ocrLang = 'eng' } = {}) {
  const metadata = await sharp(buffer).metadata();
  const worker = await createWorker(ocrLang, undefined, { cachePath: CACHE_PATH });
  let data;
  try {
    ({ data } = await worker.recognize(buffer, {}, { blocks: true }));
  } finally {
    await worker.terminate();
  }
  const lines = flattenLines(data);

  return {
    getBlocks() {
      return lines.map((l) => l.text);
    },
    getMetadata() {
      return { width: metadata.width, height: metadata.height, format: metadata.format };
    },
    /** Approximate style-aware blocks (pixel row height converted to points at 96 DPI), for building a DOCX. */
    getStyledBlocks() {
      return lines.map((l) => ({ text: l.text, fontSize: Math.max(8, Math.round(l.fontSize * 0.75)) }));
    },

    async build(translatedTexts) {
      if (translatedTexts.length !== lines.length) {
        throw new Error('Translated block count does not match extracted block count');
      }

      const parts = [];
      lines.forEach((l, i) => {
        const translated = translatedTexts[i];
        if (translated == null || translated === '') return;

        let fontSize = l.fontSize;
        const boxWidth = l.x1 - l.x0;
        const estWidth = measureTextWidth(translated, fontSize);
        if (estWidth > boxWidth * 1.05) {
          fontSize = Math.max(fontSize * ((boxWidth * 1.05) / estWidth), fontSize * 0.5, 6);
        }
        const finalWidth = Math.max(boxWidth, measureTextWidth(translated, fontSize));

        parts.push(
          `<rect x="${l.x0 - 2}" y="${l.y0 - 2}" width="${finalWidth + 4}" height="${l.y1 - l.y0 + 4}" fill="white"/>`
        );
        parts.push(
          `<text x="${l.x0}" y="${l.baselineY}" font-size="${fontSize}" font-family="sans-serif" fill="black">${escapeXml(
            translated
          )}</text>`
        );
      });

      const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${metadata.width}" height="${metadata.height}">${parts.join(
        ''
      )}</svg>`;

      const format = ['jpeg', 'png', 'webp', 'tiff'].includes(metadata.format) ? metadata.format : 'png';
      return sharp(buffer)
        .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
        .toFormat(format)
        .toBuffer();
    },
  };
}
