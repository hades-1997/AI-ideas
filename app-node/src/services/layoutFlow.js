// Greedy word-wrap + pagination for flowing paragraph text (used when the
// source document has no fixed coordinates, e.g. DOCX -> PDF/Image).

function wrapParagraph(text, fontSize, maxWidth, measure) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const candidate = `${current} ${word}`;
    if (measure(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

/**
 * @param {{text:string, fontSize?:number, bold?:boolean}[]} paragraphs
 * @param {object} opts { pageWidth, pageHeight, margin, measure(text,fontSize) }
 * @returns {{lines:{text:string,fontSize:number,bold:boolean,y:number,x:number}[]}[]} pages, y = distance from top of page
 */
export function flowParagraphsToPages(paragraphs, opts) {
  const { pageWidth, pageHeight, margin = 50, measure, lineSpacing = 1.35, paragraphGap = 0.6 } = opts;
  const maxWidth = pageWidth - margin * 2;

  const pages = [];
  let page = { lines: [] };
  let cursorY = margin;

  const pushLine = (text, fontSize, bold) => {
    const lineHeight = fontSize * lineSpacing;
    if (cursorY + lineHeight > pageHeight - margin) {
      pages.push(page);
      page = { lines: [] };
      cursorY = margin;
    }
    page.lines.push({ text, fontSize, bold, x: margin, y: cursorY });
    cursorY += lineHeight;
  };

  for (const para of paragraphs) {
    const fontSize = para.fontSize || 11;
    const text = (para.text || '').trim();
    if (!text) {
      cursorY += fontSize * lineSpacing * paragraphGap;
      continue;
    }
    const wrapped = wrapParagraph(text, fontSize, maxWidth, measure);
    wrapped.forEach((line) => pushLine(line, fontSize, !!para.bold));
    cursorY += fontSize * lineSpacing * paragraphGap;
  }
  pages.push(page);
  return pages.filter((p, i) => p.lines.length > 0 || i === 0);
}
