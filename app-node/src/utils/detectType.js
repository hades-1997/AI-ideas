import path from 'path';

const EXT_MAP = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.tif': 'image',
  '.tiff': 'image',
  '.bmp': 'image',
};

export function detectInputType(filename, mimetype) {
  const ext = path.extname(filename || '').toLowerCase();
  if (EXT_MAP[ext]) return EXT_MAP[ext];
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (mimetype && mimetype.startsWith('image/')) return 'image';
  return null;
}

export const SUPPORTED_INPUT_EXTENSIONS = Object.keys(EXT_MAP);
