const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/messages — envoi depuis le formulaire public
router.post('/', async (req, res) => {
  try {
    const { firstname, lastname, email, phone, country, address, message } = req.body;
    if (!firstname || !lastname || !email || !country || !address || !message) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
    }
    const r = await run(
      `INSERT INTO contact_messages (firstname, lastname, email, phone, country, address, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstname.trim(), lastname.trim(), email.trim(), phone?.trim() || '', country.trim(), address.trim(), message.trim()]
    );
    res.status(201).json({ success: true, id: r.lastID });
  } catch (e) {
    console.error('POST /api/messages error:', e.message);
    res.status(500).json({ error: 'Erreur serveur', details: e.message });
  }
});

// GET /api/messages — liste pour l'admin (protégé)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    let where = [];
    if (unread === '1') where.push('is_read = 0');
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (await get(`SELECT COUNT(*) as c FROM contact_messages ${w}`)).c;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const rows = await all(
      `SELECT * FROM contact_messages ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );
    const unreadCount = (await get(`SELECT COUNT(*) as c FROM contact_messages WHERE is_read = 0`)).c;
    res.json({ messages: rows, total, unreadCount, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    console.error('GET /api/messages error:', e.message);
    res.status(500).json({ error: 'Erreur serveur', details: e.message });
  }
});

// PUT /api/messages/:id/read — marquer comme lu (protégé)
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await run('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/messages/:id/unread — marquer comme non lu (protégé)
router.put('/:id/unread', authenticateToken, async (req, res) => {
  try {
    await run('UPDATE contact_messages SET is_read = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/messages/:id — supprimer (protégé)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const r = await run('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (!r.changes) return res.status(404).json({ error: 'Message non trouvé' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
