import JSZip from 'jszip';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { openDocx } from '../extractors/docxDocument.js';
import { openPdf } from '../extractors/pdfDocument.js';
import { openImage } from '../extractors/imageDocument.js';
import { renderFlowingPdf } from '../renderers/pdfFlowRenderer.js';
import { renderFlowingImages } from '../renderers/imageFlowRenderer.js';
import { renderDocxFromBlocks } from '../renderers/docxFromBlocksRenderer.js';
import { renderPdfBlocksAsImages } from '../renderers/pdfToImageRenderer.js';
import { translateTexts } from './translate.js';
import { tesseractLang } from '../utils/languages.js';

const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  zip: 'application/zip',
};

async function zipImages(buffers, baseName) {
  const zip = new JSZip();
  buffers.forEach((buf, i) => zip.file(`${baseName}-page-${i + 1}.png`, buf));
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  return { buffer: out, ext: 'zip', mime: MIME.zip };
}

async function imageToPdf(imageBuffer) {
  const png = await sharp(imageBuffer).png().toBuffer();
  const meta = await sharp(png).metadata();
  const pdfDoc = await PDFDocument.create();
  const embedded = await pdfDoc.embedPng(png);
  const page = pdfDoc.addPage([meta.width, meta.height]);
  page.drawImage(embedded, { x: 0, y: 0, width: meta.width, height: meta.height });
  return pdfDoc.save();
}

/**
 * Runs the full extract -> translate -> render pipeline for one document.
 * @param {object} opts { buffer, inputType, outputType, sourceLang, targetLang, provider, apiKey, model }
 * @returns {{buffer:Buffer, ext:string, mime:string}}
 */
export async function translateDocument(opts) {
  const { buffer, inputType, outputType, sourceLang, targetLang, provider, apiKey, model } = opts;
  const t = (texts) => translateTexts(texts, { provider, apiKey, model, sourceLang, targetLang });
  const ocrLang = tesseractLang(sourceLang);

  // --- Same-format: highest-fidelity in-place editing ---
  if (inputType === 'docx' && outputType === 'docx') {
    const doc = await openDocx(buffer);
    const translated = await t(doc.getBlocks());
    const out = await doc.build(translated);
    return { buffer: out, ext: 'docx', mime: MIME.docx };
  }

  if (inputType === 'pdf' && outputType === 'pdf') {
    const doc = await openPdf(buffer);
    const translated = await t(doc.getBlocks());
    const out = await doc.build(translated);
    return { buffer: Buffer.from(out), ext: 'pdf', mime: MIME.pdf };
  }

  if (inputType === 'image' && outputType === 'image') {
    const doc = await openImage(buffer, { ocrLang });
    const translated = await t(doc.getBlocks());
    const out = await doc.build(translated);
    const format = doc.getMetadata().format;
    const ext = format === 'jpeg' ? 'jpg' : format;
    return { buffer: out, ext, mime: MIME[format] || MIME.png };
  }

  // --- DOCX source (flowing text) -> PDF / Image ---
  if (inputType === 'docx' && (outputType === 'pdf' || outputType === 'image')) {
    const doc = await openDocx(buffer);
    const styled = doc.getStyledBlocks();
    const translated = await t(styled.map((s) => s.text));
    const paragraphs = styled.map((s, i) => ({ text: translated[i], bold: s.bold, fontSize: s.fontSize }));

    if (outputType === 'pdf') {
      const out = await renderFlowingPdf(paragraphs);
      return { buffer: Buffer.from(out), ext: 'pdf', mime: MIME.pdf };
    }
    const images = await renderFlowingImages(paragraphs);
    if (images.length === 1) return { buffer: images[0], ext: 'png', mime: MIME.png };
    return zipImages(images, 'translated');
  }

  // --- PDF source (positioned text) -> DOCX / Image ---
  if (inputType === 'pdf' && (outputType === 'docx' || outputType === 'image')) {
    const doc = await openPdf(buffer);
    const positioned = doc.getPositionedBlocks();
    const translated = await t(positioned.map((b) => b.text));

    if (outputType === 'docx') {
      const blocks = positioned.map((b, i) => ({ text: translated[i], fontSize: b.fontSize }));
      const out = await renderDocxFromBlocks(blocks);
      return { buffer: out, ext: 'docx', mime: MIME.docx };
    }
    const images = await renderPdfBlocksAsImages(doc.getPagesInfo(), positioned, translated);
    if (images.length === 1) return { buffer: images[0], ext: 'png', mime: MIME.png };
    return zipImages(images, 'translated');
  }

  // --- Image source (OCR) -> PDF / DOCX ---
  if (inputType === 'image' && (outputType === 'pdf' || outputType === 'docx')) {
    const doc = await openImage(buffer, { ocrLang });

    if (outputType === 'docx') {
      const styled = doc.getStyledBlocks();
      const translated = await t(styled.map((s) => s.text));
      const blocks = styled.map((s, i) => ({ text: translated[i], fontSize: s.fontSize }));
      const out = await renderDocxFromBlocks(blocks);
      return { buffer: out, ext: 'docx', mime: MIME.docx };
    }
    const translated = await t(doc.getBlocks());
    const translatedImage = await doc.build(translated);
    const out = await imageToPdf(translatedImage);
    return { buffer: Buffer.from(out), ext: 'pdf', mime: MIME.pdf };
  }

  throw new Error(`Unsupported conversion: ${inputType} -> ${outputType}`);
}
