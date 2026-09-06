const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

function orderNum() {
  return `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
}

router.get('/', authenticateToken, async (req, res) => {
  const { status, search, page=1, limit=20 } = req.query;
  let where=[]; let params=[];
  if (status && status!=='all') { where.push('status=?'); params.push(status); }
  if (search) { where.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)'); const s=`%${search}%`; params.push(s,s,s); }
  const w = where.length?`WHERE ${where.join(' AND ')}`:'';
  const total = (await get(`SELECT COUNT(*) as c FROM orders ${w}`, params)).c;
  const offset = (parseInt(page)-1)*parseInt(limit);
  const rows = await all(`SELECT * FROM orders ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
  res.json({ orders: rows.map(o=>({...o,items:JSON.parse(o.items||'[]')})), total, page:parseInt(page), totalPages:Math.ceil(total/parseInt(limit)) });
});

// ===== PUBLIC TRACK ENDPOINT (no auth) =====
router.get('/track', async (req, res) => {
  const { order_number, email } = req.query;
  if (!order_number || !email) return res.status(400).json({ error: 'Paramètres manquants' });
  const o = await get(
    'SELECT order_number, customer_name, status, created_at, total, shipping_cost FROM orders WHERE order_number=? AND LOWER(customer_email)=LOWER(?)',
    [order_number.trim(), email.trim()]
  );
  if (!o) return res.status(404).json({ error: 'Non trouvée' });
  res.json(o);
});

router.get('/stats', authenticateToken, async (req, res) => {
  const totalOrders = (await get('SELECT COUNT(*) as c FROM orders')).c;
  const totalRevenue = (await get("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status!='cancelled'")).s;
  const pendingOrders = (await get("SELECT COUNT(*) as c FROM orders WHERE status='pending'")).c;
  const totalProducts = (await get('SELECT COUNT(*) as c FROM products WHERE is_active=1')).c;
  const recentOrders = await all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
  const ordersByStatus = await all('SELECT status, COUNT(*) as cnt FROM orders GROUP BY status');
  res.json({ totalOrders, totalRevenue, pendingOrders, totalProducts, recentOrders: recentOrders.map(o=>({...o,items:JSON.parse(o.items||'[]')})), ordersByStatus });
});

router.get('/:id', authenticateToken, async (req, res) => {
  const o = await get('SELECT * FROM orders WHERE id=? OR order_number=?', [req.params.id, req.params.id]);
  if (!o) return res.status(404).json({ error: 'Non trouvée' });
  res.json({ ...o, items: JSON.parse(o.items||'[]') });
});

router.post('/', async (req, res) => {
  try {
    let { customer_name, customer_email, customer_phone, shipping_address, items, subtotal, shipping_cost, total, payment_method, notes } = req.body;

    if (!customer_name || !customer_email || !shipping_address) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // items can arrive as a JSON string or as an array
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items)) items = [];

    // For reservations, subtotal/total may be sent directly (as 0)
    // Otherwise compute from items
    let computedSubtotal = subtotal !== undefined ? parseFloat(subtotal) : items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    let computedShipping = shipping_cost !== undefined ? parseFloat(shipping_cost) : 0;

    if (subtotal === undefined) {
      const ft = parseFloat((await get("SELECT value FROM settings WHERE key='free_shipping_threshold'"))?.value || 50);
      const sc = parseFloat((await get("SELECT value FROM settings WHERE key='shipping_cost'"))?.value || 4.99);
      computedShipping = computedSubtotal >= ft ? 0 : sc;
    }

    const computedTotal = total !== undefined ? parseFloat(total) : computedSubtotal + computedShipping;
    const order_number = orderNum();

    const r = await run(
      'INSERT INTO orders (order_number,customer_name,customer_email,customer_phone,shipping_address,items,subtotal,shipping_cost,total,payment_method,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [
        order_number,
        customer_name,
        customer_email,
        customer_phone || '',
        typeof shipping_address === 'object' ? JSON.stringify(shipping_address) : shipping_address,
        JSON.stringify(items),
        computedSubtotal,
        computedShipping,
        computedTotal,
        payment_method || 'cod',
        notes || ''
      ]
    );

    // Decrement stock only for real purchases (not reservations)
    if (payment_method !== 'reservation') {
      for (const item of items) {
        if (item.id) await run('UPDATE products SET stock=MAX(0,stock-?) WHERE id=?', [item.quantity || 1, item.id]);
      }
    }

    res.status(201).json({ success: true, order_number, id: r.lastID, total: computedTotal });
  } catch (e) {
    console.error('POST /api/orders error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['pending','processing','shipped','delivered','cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    await run(
      "UPDATE orders SET status=?, notes=COALESCE(?,notes), updated_at=datetime('now') WHERE id=?",
      [status, notes !== undefined ? notes : null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /api/orders/:id/status error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  await run('DELETE FROM orders WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
