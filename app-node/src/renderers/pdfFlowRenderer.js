import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { loadFontBytes } from '../utils/fonts.js';
import { flowParagraphsToPages } from '../services/layoutFlow.js';

const A4 = { width: 595.28, height: 841.89 };

/** Renders style-tagged paragraphs (from a flowing source like DOCX) into a brand new paginated PDF. */
export async function renderFlowingPdf(paragraphs) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const regular = await pdfDoc.embedFont(loadFontBytes('regular'), { subset: true });
  const bold = await pdfDoc.embedFont(loadFontBytes('bold'), { subset: true });

  const margin = 56;
  const pages = flowParagraphsToPages(paragraphs, {
    pageWidth: A4.width,
    pageHeight: A4.height,
    margin,
    measure: (text, size) => regular.widthOfTextAtSize(text, size),
  });

  for (const pageDef of pages) {
    const page = pdfDoc.addPage([A4.width, A4.height]);
    for (const line of pageDef.lines) {
      const font = line.bold ? bold : regular;
      page.drawText(line.text, {
        x: line.x,
        y: A4.height - line.y - line.fontSize,
        size: line.fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  return pdfDoc.save();
}
