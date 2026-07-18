import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Builds a brand-new .docx from an ordered list of translated text blocks.
 * Used for PDF -> DOCX and Image -> DOCX, where the source has no native
 * DOCX structure to edit in place, so layout is reconstructed as flowing
 * paragraphs (fixed pixel/point positions from the source cannot be
 * preserved in an editable Word document).
 */
export async function renderDocxFromBlocks(blocks) {
  const children = blocks.map((b) => {
    const fontSize = b.fontSize || 11;
    return new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: b.text,
          bold: !!b.bold,
          size: Math.round(fontSize * 2), // docx sizes are in half-points
        }),
      ],
    });
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
