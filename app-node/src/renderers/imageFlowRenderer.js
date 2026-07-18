import sharp from 'sharp';
import { measureTextWidth } from '../utils/fonts.js';
import { flowParagraphsToPages } from '../services/layoutFlow.js';

// A4 at 150 DPI
const PAGE = { width: 1240, height: 1754 };

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Renders style-tagged paragraphs (from a flowing source like DOCX) into one PNG page image per page. */
export async function renderFlowingImages(paragraphs) {
  const margin = 70;
  const pages = flowParagraphsToPages(paragraphs, {
    pageWidth: PAGE.width,
    pageHeight: PAGE.height,
    margin,
    measure: (text, size) => measureTextWidth(text, size),
  });

  const buffers = [];
  for (const pageDef of pages) {
    const texts = pageDef.lines
      .map(
        (line) =>
          `<text x="${line.x}" y="${line.y + line.fontSize}" font-size="${line.fontSize}" font-family="sans-serif" font-weight="${
            line.bold ? 'bold' : 'normal'
          }" fill="black">${escapeXml(line.text)}</text>`
      )
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.width}" height="${PAGE.height}"><rect width="${PAGE.width}" height="${PAGE.height}" fill="white"/>${texts}</svg>`;
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    buffers.push(buf);
  }
  return buffers;
}
