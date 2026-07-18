import { readFileSync } from 'fs';
import { createRequire } from 'module';
import fontkit from '@pdf-lib/fontkit';

const require = createRequire(import.meta.url);
const base = require.resolve('dejavu-fonts-ttf/package.json').replace(/package\.json$/, 'ttf/');

// DejaVu Sans covers Latin Extended (incl. Vietnamese), Cyrillic and Greek,
// which handles the overwhelming majority of non-CJK translation targets
// without shipping multi-megabyte per-language font sets.
const FILES = {
  regular: 'DejaVuSans.ttf',
  bold: 'DejaVuSans-Bold.ttf',
  italic: 'DejaVuSans-Oblique.ttf',
  boldItalic: 'DejaVuSans-BoldOblique.ttf',
};

const cache = {};

export function loadFontBytes(variant = 'regular') {
  if (cache[variant]) return cache[variant];
  const file = FILES[variant] || FILES.regular;
  const bytes = readFileSync(base + file);
  cache[variant] = bytes;
  return bytes;
}

export function pickVariant(bold, italic) {
  if (bold && italic) return 'boldItalic';
  if (bold) return 'bold';
  if (italic) return 'italic';
  return 'regular';
}

const kitCache = {};

function getKitFont(variant = 'regular') {
  if (!kitCache[variant]) {
    kitCache[variant] = fontkit.create(loadFontBytes(variant));
  }
  return kitCache[variant];
}

/** Measures rendered text width in pixels for a given font size, using DejaVu Sans metrics. */
export function measureTextWidth(text, fontSize, variant = 'regular') {
  const font = getKitFont(variant);
  const run = font.layout(text || '');
  return (run.advanceWidth / font.unitsPerEm) * fontSize;
}
