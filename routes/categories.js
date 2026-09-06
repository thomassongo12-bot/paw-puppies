const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

function slugify(t) { return t.toString().toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').trim(); }

router.get('/', async (req, res) => {
  try {
    const cats = await all(`SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active=1 WHERE c.is_active=1 GROUP BY c.id ORDER BY c.sort_order, c.name`);
    res.json(cats);
  } catch (e) {
    console.error('GET /api/categories error:', e.message);
    res.status(500).json({ error: 'Database error', details: e.message });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  try {
    const cats = await all(`SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY c.sort_order, c.name`);
    res.json(cats);
  } catch (e) {
    console.error('GET /api/categories/all error:', e.message);
    res.status(500).json({ error: 'Database error', details: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const c = await get('SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.is_active=1 WHERE c.id=? OR c.slug=? GROUP BY c.id', [req.params.id, req.params.id]);
    if (!c) return res.status(404).json({ error: 'Non trouvée' });
    // Related: same tags
    const tags = (c.tags || '').split(',').filter(Boolean);
    let related = [];
    if (tags.length) {
      const all_cats = await all('SELECT c.id, c.name, c.slug, c.image_url, c.tags, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.is_active=1 WHERE c.is_active=1 AND c.id!=? GROUP BY c.id', [c.id]);
      related = all_cats.filter(r => {
        const rt = (r.tags||'').split(',').filter(Boolean);
        return tags.some(t => rt.includes(t));
      }).slice(0, 8);
    }
    res.json({ ...c, related });
  } catch (e) {
    console.error('GET /api/categories/:id error:', e.message);
    res.status(500).json({ error: 'Database error', details: e.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, full_description, breed_specs, suitability, gallery, image_url, sort_order, is_active, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    let slug = slugify(name);
    const ex = await get('SELECT id FROM categories WHERE slug=?', [slug]);
    if (ex) slug += '-' + Date.now();
    const r = await run(
      'INSERT INTO categories (name,slug,description,full_description,breed_specs,suitability,gallery,image_url,sort_order,is_active,tags) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [name,slug,description||'',full_description||'',
       typeof breed_specs==='object'?JSON.stringify(breed_specs):(breed_specs||'{}'),
       Array.isArray(suitability)?JSON.stringify(suitability):(suitability||'[]'),
       Array.isArray(gallery)?JSON.stringify(gallery):(gallery||'[]'),
       image_url||'',sort_order||0,is_active!==undefined?is_active:1,tags||'']);
    res.status(201).json({ success: true, id: r.lastID });
  } catch (e) {
    console.error('POST /api/categories error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, full_description, breed_specs, suitability, gallery, image_url, sort_order, is_active, tags } = req.body;
    const c = await get('SELECT * FROM categories WHERE id=?', [req.params.id]);
    if (!c) return res.status(404).json({ error: 'Non trouvée' });
    await run(
      'UPDATE categories SET name=?,description=?,full_description=?,breed_specs=?,suitability=?,gallery=?,image_url=?,sort_order=?,is_active=?,tags=? WHERE id=?',
      [
        name||c.name,
        description!==undefined?description:c.description,
        full_description!==undefined?full_description:(c.full_description||''),
        breed_specs!==undefined?(typeof breed_specs==='object'?JSON.stringify(breed_specs):breed_specs):(c.breed_specs||'{}'),
        suitability!==undefined?(Array.isArray(suitability)?JSON.stringify(suitability):suitability):(c.suitability||'[]'),
        gallery!==undefined?(Array.isArray(gallery)?JSON.stringify(gallery):gallery):(c.gallery||'[]'),
        image_url!==undefined?image_url:c.image_url,
        sort_order!==undefined?sort_order:c.sort_order,
        is_active!==undefined?is_active:c.is_active,
        tags!==undefined?tags:(c.tags||''),
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/categories/:id error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const cnt = await get('SELECT COUNT(*) as c FROM products WHERE category_id=?', [req.params.id]);
    if (cnt.c > 0) return res.status(400).json({ error: `${cnt.c} produit(s) dans cette catégorie` });
    await run('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/categories/:id error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
