import { Router } from 'express';
import multer from 'multer';
import { translateDocument } from '../services/pipeline.js';
import { detectInputType, SUPPORTED_INPUT_EXTENSIONS } from '../utils/detectType.js';
import { LANGUAGES } from '../utils/languages.js';
import { PROVIDER_NAMES } from '../providers/index.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();

router.get('/languages', (req, res) => {
  res.json(LANGUAGES);
});

router.get('/providers', (req, res) => {
  res.json(PROVIDER_NAMES);
});

router.post('/translate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Field name must be "file".' });
    }
    const { sourceLang, targetLang, outputFormat, provider, apiKey, model } = req.body;

    if (!targetLang) return res.status(400).json({ error: 'targetLang is required' });
    if (!outputFormat || !['pdf', 'docx', 'image'].includes(outputFormat)) {
      return res.status(400).json({ error: 'outputFormat must be one of: pdf, docx, image' });
    }
    if (!provider || !PROVIDER_NAMES.includes(provider)) {
      return res.status(400).json({ error: `provider must be one of: ${PROVIDER_NAMES.join(', ')}` });
    }

    const inputType = detectInputType(req.file.originalname, req.file.mimetype);
    if (!inputType) {
      return res.status(400).json({
        error: `Unsupported file type. Supported extensions: ${SUPPORTED_INPUT_EXTENSIONS.join(', ')}`,
      });
    }

    const result = await translateDocument({
      buffer: req.file.buffer,
      inputType,
      outputType: outputFormat,
      sourceLang: sourceLang || 'auto',
      targetLang,
      provider,
      apiKey: apiKey || undefined,
      model: model || undefined,
    });

    const baseName = req.file.originalname.replace(/\.[^.]+$/, '');
    res.setHeader('Content-Type', result.mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(baseName)}-translated.${result.ext}"`
    );
    res.send(result.buffer);
  } catch (err) {
    console.error('[translate]', err);
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
});

export default router;
