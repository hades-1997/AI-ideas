// Manual smoke test for the extract/render pipeline, using a fake translator
// (no AI API calls) so it can run offline. Run with: node test/smoke.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';

import { openDocx } from '../src/extractors/docxDocument.js';
import { openPdf } from '../src/extractors/pdfDocument.js';
import { openImage } from '../src/extractors/imageDocument.js';
import { renderFlowingPdf } from '../src/renderers/pdfFlowRenderer.js';
import { renderFlowingImages } from '../src/renderers/imageFlowRenderer.js';
import { renderDocxFromBlocks } from '../src/renderers/docxFromBlocksRenderer.js';
import { renderPdfBlocksAsImages } from '../src/renderers/pdfToImageRenderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

const fakeT = (arr) => arr.map((s) => `[VI] ${s}`);
let failures = 0;

function check(label, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'} - ${label}`);
  if (!cond) failures++;
}

// --- Build sample source files ---
const docxDoc = new Document({
  sections: [
    {
      children: [
        new Paragraph({ text: 'Hello World', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({
          children: [
            new TextRun('This is a '),
            new TextRun({ text: 'bold', bold: true }),
            new TextRun(' word inside a sentence.'),
          ],
        }),
        new Paragraph({ text: 'Second paragraph with more text to translate.' }),
      ],
    },
  ],
});
const sampleDocx = await Packer.toBuffer(docxDoc);

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([612, 792]);
const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
page.drawText('Hello World, this is a test PDF.', { x: 50, y: 700, size: 18, font: helv });
page.drawText('Second line of text at a different position.', { x: 50, y: 650, size: 12, font: helv });
const samplePdf = Buffer.from(await pdfDoc.save());

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200">
  <rect width="800" height="200" fill="white"/>
  <text x="20" y="60" font-size="32" font-family="sans-serif">Hello World, this is line one.</text>
  <text x="20" y="120" font-size="32" font-family="sans-serif">Second line of sample text.</text>
</svg>`;
const sampleImage = await sharp(Buffer.from(svg)).png().toBuffer();

// --- Same-format in-place round trips ---
{
  const doc = await openDocx(sampleDocx);
  const blocks = doc.getBlocks();
  const out = await doc.build(fakeT(blocks));
  fs.writeFileSync(path.join(outDir, 'docx2docx.docx'), out);
  const reopened = await openDocx(out);
  check('docx->docx round trip', reopened.getBlocks().every((t, i) => t === `[VI] ${blocks[i]}`));
}

{
  const doc = await openPdf(samplePdf);
  const blocks = doc.getBlocks();
  const out = await doc.build(fakeT(blocks));
  fs.writeFileSync(path.join(outDir, 'pdf2pdf.pdf'), out);
  check('pdf->pdf produced non-empty output', out.length > 0);
}

{
  const doc = await openImage(sampleImage, { ocrLang: 'eng' });
  const blocks = doc.getBlocks();
  check('image OCR found 2 lines', blocks.length === 2);
  const out = await doc.build(fakeT(blocks));
  fs.writeFileSync(path.join(outDir, 'image2image.png'), out);
  check('image->image produced non-empty output', out.length > 0);
}

// --- Cross-format ---
{
  const doc = await openDocx(sampleDocx);
  const styled = doc.getStyledBlocks();
  const translated = fakeT(styled.map((s) => s.text));
  const paragraphs = styled.map((s, i) => ({ text: translated[i], bold: s.bold, fontSize: s.fontSize }));
  const out = await renderFlowingPdf(paragraphs);
  fs.writeFileSync(path.join(outDir, 'docx2pdf.pdf'), out);
  const reopened = await openPdf(Buffer.from(out));
  check('docx->pdf text present', reopened.getBlocks().join(' ').includes('bold'));
}

{
  const doc = await openDocx(sampleDocx);
  const styled = doc.getStyledBlocks();
  const translated = fakeT(styled.map((s) => s.text));
  const paragraphs = styled.map((s, i) => ({ text: translated[i], bold: s.bold, fontSize: s.fontSize }));
  const images = await renderFlowingImages(paragraphs);
  fs.writeFileSync(path.join(outDir, 'docx2image.png'), images[0]);
  check('docx->image produced at least 1 page', images.length >= 1);
}

{
  const doc = await openPdf(samplePdf);
  const positioned = doc.getPositionedBlocks();
  const translated = fakeT(positioned.map((b) => b.text));
  const blocks = positioned.map((b, i) => ({ text: translated[i], fontSize: b.fontSize }));
  const out = await renderDocxFromBlocks(blocks);
  fs.writeFileSync(path.join(outDir, 'pdf2docx.docx'), out);
  const reopened = await openDocx(out);
  check('pdf->docx text present', reopened.getBlocks().join(' ').includes('Hello World'));
}

{
  const doc = await openPdf(samplePdf);
  const positioned = doc.getPositionedBlocks();
  const translated = fakeT(positioned.map((b) => b.text));
  const images = await renderPdfBlocksAsImages(doc.getPagesInfo(), positioned, translated);
  fs.writeFileSync(path.join(outDir, 'pdf2image.png'), images[0]);
  check('pdf->image produced at least 1 page', images.length >= 1);
}

{
  const doc = await openImage(sampleImage, { ocrLang: 'eng' });
  const translated = fakeT(doc.getBlocks());
  const translatedImage = await doc.build(translated);
  const png = await sharp(translatedImage).png().toBuffer();
  const meta = await sharp(png).metadata();
  const wrapDoc = await PDFDocument.create();
  const embedded = await wrapDoc.embedPng(png);
  const wrapPage = wrapDoc.addPage([meta.width, meta.height]);
  wrapPage.drawImage(embedded, { x: 0, y: 0, width: meta.width, height: meta.height });
  const out = await wrapDoc.save();
  fs.writeFileSync(path.join(outDir, 'image2pdf.pdf'), out);
  check('image->pdf produced non-empty output', out.length > 0);
}

{
  const doc = await openImage(sampleImage, { ocrLang: 'eng' });
  const styled = doc.getStyledBlocks();
  const translated = fakeT(styled.map((s) => s.text));
  const blocks = styled.map((s, i) => ({ text: translated[i], fontSize: s.fontSize }));
  const out = await renderDocxFromBlocks(blocks);
  fs.writeFileSync(path.join(outDir, 'image2docx.docx'), out);
  const reopened = await openDocx(out);
  check('image->docx text present', reopened.getBlocks().join(' ').includes('Hello World'));
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
