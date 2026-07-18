import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import { loadFontBytes } from '../utils/fonts.js';

const require = createRequire(import.meta.url);
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

const STANDARD_FONT_DATA_URL = pathToFileURL(
  require.resolve('pdfjs-dist/package.json').replace(/package\.json$/, 'standard_fonts/')
).href;

const Y_TOLERANCE = 2;
const GAP_SPACE_RATIO = 0.22;

function groupLines(items, viewportHeight) {
  const usable = items.filter((it) => it.str && it.str.trim() !== '' && it.width > 0);
  const lines = [];
  for (const it of usable) {
    const fontSize = Math.hypot(it.transform[0], it.transform[1]) || 10;
    const x = it.transform[4];
    const y = it.transform[5];
    let line = lines.find((l) => Math.abs(l.y - y) <= Y_TOLERANCE);
    if (!line) {
      line = { y, fontSize, items: [] };
      lines.push(line);
    }
    line.items.push({ str: it.str, x, width: it.width, fontSize });
    line.fontSize = Math.max(line.fontSize, fontSize);
  }
  return lines.map((line) => {
    line.items.sort((a, b) => a.x - b.x);
    let text = '';
    let prevEnd = null;
    for (const it of line.items) {
      if (prevEnd !== null && it.x - prevEnd > GAP_SPACE_RATIO * line.fontSize && !text.endsWith(' ')) {
        text += ' ';
      }
      text += it.str;
      prevEnd = it.x + it.width;
    }
    const x0 = Math.min(...line.items.map((i) => i.x));
    const x1 = Math.max(...line.items.map((i) => i.x + i.width));
    return { text, x: x0, y: line.y, width: x1 - x0, fontSize: line.fontSize };
  });
}

export async function openPdf(buffer) {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  });
  const doc = await loadingTask.promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const [x0, y0, x1, y1] = page.view;
    const textContent = await page.getTextContent();
    const lines = groupLines(textContent.items, y1 - y0);
    pages.push({ width: x1 - x0, height: y1 - y0, lines });
  }

  const blocks = [];
  pages.forEach((page, pageIndex) => {
    page.lines.forEach((line, lineIndex) => blocks.push({ pageIndex, lineIndex, ...line }));
  });

  return {
    getPageCount() {
      return pages.length;
    },
    getPagesInfo() {
      return pages.map((p) => ({ width: p.width, height: p.height }));
    },
    getBlocks() {
      return blocks.map((b) => b.text);
    },
    getStyledBlocks() {
      return blocks.map((b) => ({ text: b.text, fontSize: b.fontSize, pageIndex: b.pageIndex }));
    },
    /** Full block data including position, for rendering into a raster image page-by-page. */
    getPositionedBlocks() {
      return blocks.map((b) => ({ ...b }));
    },

    async build(translatedTexts) {
      if (translatedTexts.length !== blocks.length) {
        throw new Error('Translated block count does not match extracted block count');
      }
      const pdfDoc = await PDFDocument.load(buffer);
      pdfDoc.registerFontkit(fontkit);
      const font = await pdfDoc.embedFont(loadFontBytes('regular'), { subset: true });

      const pdfPages = pdfDoc.getPages();
      blocks.forEach((b, i) => {
        const translated = translatedTexts[i];
        if (translated == null || translated === '') return;
        const page = pdfPages[b.pageIndex];
        if (!page) return;

        let fontSize = b.fontSize;
        const textWidth = font.widthOfTextAtSize(translated, fontSize);
        const maxWidth = b.width * 1.08 + 4;
        if (textWidth > maxWidth) {
          fontSize = Math.max(fontSize * (maxWidth / textWidth), fontSize * 0.5, 5);
        }

        const padX = 1.5;
        const rectHeight = b.fontSize * 1.3;
        page.drawRectangle({
          x: b.x - padX,
          y: b.y - b.fontSize * 0.3,
          width: Math.max(b.width, font.widthOfTextAtSize(translated, fontSize)) + padX * 2,
          height: rectHeight,
          color: rgb(1, 1, 1),
        });
        page.drawText(translated, {
          x: b.x,
          y: b.y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });

      return pdfDoc.save();
    },
  };
}
