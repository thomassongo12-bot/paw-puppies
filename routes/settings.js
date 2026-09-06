const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Local disk storage ────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'favicon' ? 'favicon' : 'image';
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${prefix}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg|gif|ico/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// ── GET all settings ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rows = await all('SELECT key, value FROM settings');
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUT update settings ───────────────────────────────────────────────────────
router.put('/', authenticateToken, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value || '')]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Upload helper ─────────────────────────────────────────────────────────────
async function handleUpload(req, res, settingKey) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    const url = `/uploads/${req.file.filename}`;
    await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [settingKey, url]);
    res.json({ success: true, url });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: e.message });
  }
}

// ── Upload routes ─────────────────────────────────────────────────────────────
router.post('/upload/logo', authenticateToken, upload.single('logo'),
  (req, res) => handleUpload(req, res, 'logo_url'));

router.post('/upload/favicon', authenticateToken, upload.single('favicon'),
  (req, res) => handleUpload(req, res, 'favicon_url'));

router.post('/upload/product-image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/upload/banner', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
