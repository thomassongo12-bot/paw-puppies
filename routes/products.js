const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

function slugify(t) { return t.toString().toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').trim(); }
function tryParse(s, fb) { try { return JSON.parse(s); } catch { return fb; } }

// Parse tags from DB (stored as JSON array or comma-separated string)
function parseTags(raw) {
  if (!raw) return [];
  const parsed = tryParse(raw, null);
  if (Array.isArray(parsed)) return parsed;
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

router.get('/', async (req, res) => {
  try {
    const { category, search, featured, page=1, limit=12, sort='created_at', order='desc', admin, tag } = req.query;
    let where = []; let params = [];
    if (!admin) { where.push('p.is_active=1'); }
    if (featured==='1') { where.push('p.is_featured=1'); }
    if (category) {
      const cat = await get('SELECT id FROM categories WHERE slug=? OR id=?', [category, category]);
      if (cat) { where.push('p.category_id=?'); params.push(cat.id); }
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.brand LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ? OR c.name LIKE ? OR c.slug LIKE ?)');
      const s = `%${search}%`; params.push(s,s,s,s,s,s);
    }
    if (tag) {
      where.push('p.tags LIKE ?');
      params.push(`%${tag}%`);
    }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sorts = {name:'p.name',price:'p.price',created_at:'p.created_at'};
    const sc = sorts[sort]||'p.created_at';
    const sd = order==='asc'?'ASC':'DESC';
    const total = (await get(`SELECT COUNT(*) as c FROM products p LEFT JOIN categories c ON c.id=p.category_id ${w}`, params)).c;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const rows = await all(`SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id ${w} ORDER BY ${sc} ${sd} LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    res.json({
      products: rows.map(p => ({ ...p, images: tryParse(p.images,[]), tags: parseTags(p.tags) })),
      total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total/parseInt(limit))
    });
  } catch (e) {
    console.error('GET /api/products error:', e.message);
    res.status(500).json({ error: 'Database error', details: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await get('SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id=? OR p.slug=?', [req.params.id, req.params.id]);
    if (!p) return res.status(404).json({ error: 'Produit non trouvé' });
    const related = await all('SELECT id,name,slug,price,sale_price,images,short_description FROM products WHERE category_id=? AND id!=? AND is_active=1 LIMIT 4', [p.category_id, p.id]);
    res.json({
      ...p,
      images: tryParse(p.images,[]),
      tags: parseTags(p.tags),
      variants: tryParse(p.variants, []),
      related: related.map(r => ({ ...r, images: tryParse(r.images,[]) }))
    });
  } catch (e) {
    console.error('GET /api/products/:id error:', e.message);
    res.status(500).json({ error: 'Database error', details: e.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, short_description, price, sale_price, stock, category_id,
            images, is_featured, is_active, requires_prescription,
            brand, dosage, package_size, sku,
            tags, meta_title, meta_description, variants } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nom et prix requis' });
    let slug = slugify(name);
    if (await get('SELECT id FROM products WHERE slug=?', [slug])) slug += '-' + Date.now();
    const r = await run(
      `INSERT INTO products
        (name,slug,description,short_description,price,sale_price,stock,category_id,
         images,is_featured,is_active,requires_prescription,brand,dosage,package_size,sku,
         tags,meta_title,meta_description,variants)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, slug, description||'', short_description||'',
       parseFloat(price), sale_price ? parseFloat(sale_price) : null,
       parseInt(stock)||0, category_id||null,
       JSON.stringify(images||[]),
       is_featured?1:0, is_active!==false?1:0, requires_prescription?1:0,
       brand||'', dosage||'', package_size||'', sku||'',
       JSON.stringify(Array.isArray(tags) ? tags : []),
       meta_title||'', meta_description||'',
       JSON.stringify(Array.isArray(variants) ? variants : [])]
    );
    res.status(201).json({ success: true, id: r.lastID });
  } catch (e) {
    console.error('POST /api/products error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const p = await get('SELECT * FROM products WHERE id=?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Non trouvé' });
    const b = req.body;
    await run(
      `UPDATE products SET
        name=?,description=?,short_description=?,price=?,sale_price=?,stock=?,category_id=?,
        images=?,is_featured=?,is_active=?,requires_prescription=?,
        brand=?,dosage=?,package_size=?,sku=?,
        tags=?,meta_title=?,meta_description=?,variants=?,
        updated_at=datetime('now')
       WHERE id=?`,
      [
        b.name??p.name,
        b.description??p.description,
        b.short_description??p.short_description,
        b.price!==undefined ? parseFloat(b.price) : p.price,
        b.sale_price!==undefined ? (b.sale_price ? parseFloat(b.sale_price) : null) : p.sale_price,
        b.stock!==undefined ? parseInt(b.stock) : p.stock,
        b.category_id!==undefined ? b.category_id : p.category_id,
        b.images!==undefined ? JSON.stringify(b.images) : p.images,
        b.is_featured!==undefined ? (b.is_featured?1:0) : p.is_featured,
        b.is_active!==undefined ? (b.is_active?1:0) : p.is_active,
        b.requires_prescription!==undefined ? (b.requires_prescription?1:0) : p.requires_prescription,
        b.brand??p.brand,
        b.dosage??p.dosage,
        b.package_size??p.package_size,
        b.sku??p.sku,
        b.tags!==undefined ? JSON.stringify(Array.isArray(b.tags) ? b.tags : []) : (p.tags||'[]'),
        b.meta_title!==undefined ? b.meta_title : (p.meta_title||''),
        b.meta_description!==undefined ? b.meta_description : (p.meta_description||''),
        b.variants!==undefined ? JSON.stringify(Array.isArray(b.variants) ? b.variants : []) : (p.variants||'[]'),
        req.params.id
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/products/:id error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const r = await run('DELETE FROM products WHERE id=?', [req.params.id]);
    if (!r.changes) return res.status(404).json({ error: 'Non trouvé' });
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/products/:id error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
