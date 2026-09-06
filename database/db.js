const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

// ─── Client : Turso en production, SQLite local en dev ───────────────────────
// En local sans accès réseau à Turso, on force SQLite local
// Utilise Turso si les variables d'environnement sont définies, sinon SQLite local
const useTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

const db = createClient(
  useTurso
    ? {
        url:       process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: 'file:./database/pharmacy.db',
      }
);

const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function run(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return { lastID: Number(result.lastInsertRowid), changes: result.rowsAffected };
}

async function get(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  if (!result.rows.length) return undefined;
  return rowToObject(result.columns, result.rows[0]);
}

async function all(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows.map(row => rowToObject(result.columns, row));
}

function rowToObject(columns, row) {
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

// ─── Init / Migrations ───────────────────────────────────────────────────────
async function init() {
  // PRAGMAs only supported by local SQLite, not Turso remote
  if (!useTurso) {
    await run('PRAGMA foreign_keys = ON');
    await run('PRAGMA journal_mode = WAL');
  }

  // Migrations — ajouter colonnes si absentes
  try { await run("ALTER TABLE products ADD COLUMN tags TEXT DEFAULT '[]'"); } catch {}
  try { await run("ALTER TABLE categories ADD COLUMN tags TEXT DEFAULT ''"); } catch {}
  try { await run("ALTER TABLE categories ADD COLUMN full_description TEXT DEFAULT ''"); } catch {}
  try { await run("ALTER TABLE categories ADD COLUMN breed_specs TEXT DEFAULT '{}'"); } catch {}
  try { await run("ALTER TABLE categories ADD COLUMN suitability TEXT DEFAULT '[]'"); } catch {}
  try { await run("ALTER TABLE categories ADD COLUMN gallery TEXT DEFAULT '[]'"); } catch {}
  try { await run("ALTER TABLE products ADD COLUMN meta_title TEXT DEFAULT ''"); } catch {}
  try { await run("ALTER TABLE products ADD COLUMN meta_description TEXT DEFAULT ''"); } catch {}
  try { await run("ALTER TABLE products ADD COLUMN variants TEXT DEFAULT '[]'"); } catch {}

  await run(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstname TEXT NOT NULL,
    lastname  TEXT NOT NULL,
    email     TEXT NOT NULL,
    phone     TEXT DEFAULT '',
    country   TEXT DEFAULT '',
    address   TEXT DEFAULT '',
    message   TEXT NOT NULL,
    is_read   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  // ── Tables ──────────────────────────────────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT DEFAULT ''
  )`);

  await run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '', image_url TEXT DEFAULT '', parent_id INTEGER,
    sort_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '', short_description TEXT DEFAULT '',
    price REAL NOT NULL, sale_price REAL, stock INTEGER DEFAULT 0,
    category_id INTEGER, images TEXT DEFAULT '[]',
    is_featured INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
    requires_prescription INTEGER DEFAULT 0,
    brand TEXT DEFAULT '', dosage TEXT DEFAULT '', package_size TEXT DEFAULT '', sku TEXT DEFAULT '',
    tags TEXT DEFAULT '[]', meta_title TEXT DEFAULT '', meta_description TEXT DEFAULT '',
    variants TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT DEFAULT '',
    shipping_address TEXT NOT NULL, items TEXT NOT NULL,
    subtotal REAL NOT NULL, shipping_cost REAL DEFAULT 0, total REAL NOT NULL,
    status TEXT DEFAULT 'pending', payment_method TEXT DEFAULT 'cod', notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin', is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, subtitle TEXT,
    image_url TEXT, link TEXT, button_text TEXT DEFAULT 'Shop Now',
    is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    location TEXT DEFAULT '',
    country TEXT DEFAULT '',
    breed TEXT DEFAULT '',
    puppy_name TEXT DEFAULT '',
    stars INTEGER DEFAULT 5,
    review_date TEXT DEFAULT (date('now')),
    text TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  // ── Settings par défaut ─────────────────────────────────────────────────────
  const defaults = [
    ['site_name','Paw Puppies'],['site_tagline','Everything your dog needs'],
    ['site_description','Premium dog food, treats, toys, health products and accessories delivered to your door'],
    ['logo_url',''],['favicon_url',''],
    ['contact_email','contact@Paw Puppies.com'],['contact_phone','+44 20 0000 0000'],
    ['contact_address','123 Dog Lane, London'],
    ['working_hours','Mon-Fri: 8am-8pm, Sat: 9am-5pm'],
    ['currency','GBP'],['currency_symbol','£'],
    ['primary_color','#C0541A'],['secondary_color','#5A8A3C'],
    ['free_shipping_threshold','40'],['shipping_cost','3.99'],
    ['meta_title','Paw Puppies - Premium Dog Products Online'],
    ['meta_description','Buy premium dog food, treats, toys and accessories online'],
    ['google_analytics_id',''],['facebook_url',''],['instagram_url',''],
    ['twitter_url',''],['whatsapp_number',''],
    ['payment_cod_enabled','1'],['payment_bank_enabled','1'],
    ['bank_details','Bank: HSBC\nIBAN: GB00 XXXX\nBIC: MIDLGB22'],
    ['footer_text','© 2024 Paw Puppies. All rights reserved.']
  ];
  for (const [k, v] of defaults) {
    await run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [k, v]);
  }

  // ── Admin user ──────────────────────────────────────────────────────────────
  const admin = await get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)',
      ['admin', 'admin@Paw Puppies.com', hash, 'admin']
    );
  }

  // ── Catégories ──────────────────────────────────────────────────────────────
  const catCnt = await get('SELECT COUNT(*) as c FROM categories');
  if (!catCnt.c) {
    const cats = [
      ['Dry Food',          'dry-food',        'Premium dry kibble for all breeds and life stages',   1],
      ['Wet Food',          'wet-food',         'Tasty wet food and pâtés for dogs',                  2],
      ['Treats & Snacks',   'treats',           'Healthy treats, chews and training snacks',           3],
      ['Toys',              'toys',             'Interactive and chew toys for dogs',                  4],
      ['Health & Vitamins', 'health',           'Supplements, vitamins and health products',           5],
      ['Grooming',          'grooming',         'Shampoos, brushes, nail clippers and more',           6],
      ['Collars & Leashes', 'collars-leashes',  'Collars, leashes, harnesses and ID tags',             7],
      ['Beds & Furniture',  'beds',             'Comfortable beds, crates and mats',                   8],
      ['Travel & Outdoor',  'travel',           'Car accessories, carriers and outdoor gear',          9],
      ['Clothing',          'clothing',         'Dog coats, boots and costumes',                      10],
      ['Bowls & Feeders',   'bowls',            'Food and water bowls, slow feeders',                 11],
      ['Training',          'training',         'Training aids, pads and clickers',                   12],
    ];
    for (const [n, s, d, o] of cats) {
      await run(
        'INSERT INTO categories (name,slug,description,sort_order) VALUES (?,?,?,?)',
        [n, s, d, o]
      );
    }
  }

  // ── Produits de démonstration ───────────────────────────────────────────────
  const prodCnt = await get('SELECT COUNT(*) as c FROM products');
  if (!prodCnt.c) {
    const c = await all('SELECT id, slug FROM categories');
    const cm = {};
    for (const x of c) cm[x.slug] = x.id;

    const prods = [
      ['Royal Canin Adult Medium','royal-canin-adult-medium','Complete dry food for medium breed adult dogs','High-quality kibble formulated for dogs 11–25 kg. Rich in proteins to support lean muscle mass and healthy digestion.',28.99,null,120,'dry-food',1,0,'Royal Canin','15 kg','Bag of 15 kg'],
      ['Pedigree Chicken Pouches','pedigree-chicken-pouches','Wet food with chicken in gravy','Tasty and nutritious wet food for adult dogs, made with real chicken in a rich gravy sauce.',9.50,7.99,85,'wet-food',1,0,'Pedigree','100g × 12','Pack of 12 pouches'],
      ['Ziwi Peak Beef Jerky Treats','ziwi-beef-jerky','Air-dried beef treats – grain free','Premium grain-free beef jerky made with 96% meat, organs and bone. Ideal as a daily treat or training reward.',14.99,null,60,'treats',0,0,'Ziwi Peak','100 g','Resealable bag'],
      ['Kong Classic Medium','kong-classic-medium','Durable rubber chew toy','The iconic red Kong toy in medium size. Fill with kibble or peanut butter to keep your dog entertained for hours.',12.99,10.99,150,'toys',1,0,'Kong','Medium','Single toy'],
      ['YuMOVE Joint Supplement','yumove-joint','Daily joint supplement for dogs','Vet-approved joint supplement with green-lipped mussel, glucosamine and vitamins. Supports mobility and joint health.',24.99,null,45,'health',1,0,'YuMOVE','60 tablets','Pot of 60 tablets'],
      ['Animology Deep Clean Shampoo','animology-shampoo','Deep clean dog shampoo 250ml','Professional-grade shampoo that removes grease, dirt and odours. Suitable for all coat types. pH-balanced formula.',7.99,null,70,'grooming',0,0,'Animology','250 ml','250 ml bottle'],
      ['Ruffwear Front Range Harness','ruffwear-harness','Padded everyday harness','No-pull padded harness with two leash attachment points. Lightweight, breathable and fully adjustable.',49.99,42.99,35,'collars-leashes',1,0,'Ruffwear','Medium','Harness only'],
      ['MidWest iCrate Dog Bed','midwest-dog-bed','Plush orthopedic dog bed','Ultra-soft orthopedic foam bed that fits perfectly inside standard crates. Removable and machine-washable cover.',34.99,null,28,'beds',0,0,'MidWest','Large 90×60cm','Bed only'],
      ['Puppy Training Pads 100pk','puppy-pads-100','Super-absorbent training pads','Quick-dry leak-proof training pads with attractant scent. Perfect for puppy house-training and senior dogs.',15.99,12.99,200,'training',1,0,'All4Pets','60×60 cm','Pack of 100'],
      ['Stainless Steel Dog Bowl Set','steel-bowl-set','Non-slip double bowl set','Heavy-duty stainless steel bowls with non-slip rubber base. Dishwasher safe. Available in multiple sizes.',11.99,null,90,'bowls',0,0,'PetBasics','2 × 750 ml','Set of 2 bowls'],
    ];
    for (const [n, s, sd, d, p, sp, st, cs, f, rx, b, dos, pk] of prods) {
      await run(
        'INSERT INTO products (name,slug,short_description,description,price,sale_price,stock,category_id,is_featured,requires_prescription,brand,dosage,package_size) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [n, s, sd, d, p, sp, st, cm[cs] || null, f, rx, b, dos, pk]
      );
    }
  }

  console.log('✅ Paw Puppies database initialised');
}

const initPromise = init().catch(e => { console.error('DB init error:', e); });

module.exports = { run, get, all, initPromise };