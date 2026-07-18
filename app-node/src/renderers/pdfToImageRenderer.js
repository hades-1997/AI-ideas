import sharp from 'sharp';

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Renders the translated text layer of a PDF (extracted via pdfDocument.js)
 * onto plain white page images, one PNG per page. This reproduces the text
 * layout only -- non-text graphics (images, shading, vector art) in the
 * original PDF are not rasterized, since doing so would require a full PDF
 * rendering engine (e.g. poppler/Ghostscript) which this project does not
 * depend on. Best suited for text-heavy documents.
 */
export async function renderPdfBlocksAsImages(pagesInfo, blocks, translatedTexts, dpi = 150) {
  const scale = dpi / 72;
  const byPage = new Map();
  blocks.forEach((b, i) => {
    const translated = translatedTexts[i];
    if (translated == null || translated === '') return;
    if (!byPage.has(b.pageIndex)) byPage.set(b.pageIndex, []);
    byPage.get(b.pageIndex).push({ ...b, translated });
  });

  const buffers = [];
  for (let pageIndex = 0; pageIndex < pagesInfo.length; pageIndex++) {
    const { width, height } = pagesInfo[pageIndex];
    const pxW = Math.round(width * scale);
    const pxH = Math.round(height * scale);
    const lines = byPage.get(pageIndex) || [];
    const texts = lines
      .map((l) => {
        const x = l.x * scale;
        const y = (height - l.y) * scale;
        const fontSize = l.fontSize * scale;
        return `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="sans-serif" fill="black">${escapeXml(
          l.translated
        )}</text>`;
      })
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}"><rect width="${pxW}" height="${pxH}" fill="white"/>${texts}</svg>`;
    buffers.push(await sharp(Buffer.from(svg)).png().toBuffer());
  }
  return buffers;
}
