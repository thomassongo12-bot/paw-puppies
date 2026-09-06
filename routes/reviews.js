const express = require('express');
const router  = express.Router();
const { run, get, all } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

function tryParse(s, fb) { try { return JSON.parse(s); } catch { return fb; } }

// ── Public: GET all active reviews ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { country, breed, page = 1, limit = 20 } = req.query;
    let where = ['is_active = 1'], params = [];

    if (country) { where.push('location LIKE ?'); params.push(`%${country}%`); }
    if (breed)   { where.push('(breed LIKE ? OR puppy_name LIKE ?)'); params.push(`%${breed}%`, `%${breed}%`); }

    const w      = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total  = (await get(`SELECT COUNT(*) as c FROM reviews ${w}`, params)).c;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const rows   = await all(
      `SELECT * FROM reviews ${w} ORDER BY review_date DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      reviews: rows.map(r => ({ ...r, images: tryParse(r.images, []) })),
      total, page: parseInt(page), limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: GET all reviews (including inactive) ──────────────────────────────
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM reviews ORDER BY id DESC');
    res.json(rows.map(r => ({ ...r, images: tryParse(r.images, []) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: GET single review ─────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  const r = await get('SELECT * FROM reviews WHERE id=?', [req.params.id]);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ ...r, images: tryParse(r.images, []) });
});

// ── Admin: POST create review ────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      author, location, country, breed, puppy_name,
      stars = 5, review_date, text, images = [], is_active = 1
    } = req.body;

    if (!author || !text) return res.status(400).json({ error: 'Author and text required' });

    const r = await run(
      `INSERT INTO reviews
        (author, location, country, breed, puppy_name, stars, review_date, text, images, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        author, location || '', country || '', breed || '', puppy_name || '',
        parseInt(stars), review_date || new Date().toISOString().split('T')[0],
        text, JSON.stringify(Array.isArray(images) ? images : []),
        is_active ? 1 : 0
      ]
    );
    res.status(201).json({ success: true, id: r.lastID });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Admin: PUT update review ─────────────────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await get('SELECT * FROM reviews WHERE id=?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const b = req.body;
    await run(
      `UPDATE reviews SET
        author=?, location=?, country=?, breed=?, puppy_name=?,
        stars=?, review_date=?, text=?, images=?, is_active=?,
        updated_at=datetime('now')
       WHERE id=?`,
      [
        b.author   ?? existing.author,
        b.location ?? existing.location,
        b.country  ?? existing.country,
        b.breed    ?? existing.breed,
        b.puppy_name ?? existing.puppy_name,
        b.stars    !== undefined ? parseInt(b.stars) : existing.stars,
        b.review_date ?? existing.review_date,
        b.text     ?? existing.text,
        b.images   !== undefined ? JSON.stringify(Array.isArray(b.images) ? b.images : []) : existing.images,
        b.is_active !== undefined ? (b.is_active ? 1 : 0) : existing.is_active,
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Admin: DELETE review ─────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  const r = await run('DELETE FROM reviews WHERE id=?', [req.params.id]);
  if (!r.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
