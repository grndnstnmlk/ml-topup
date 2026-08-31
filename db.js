const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Tentukan lokasi file database SQLite
let targetDbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

try {
  fs.mkdirSync(path.dirname(targetDbPath), { recursive: true });
} catch (err) {
  console.warn(`[DB] Gagal membuat direktori ${targetDbPath} (${err.message}), fallback ke direktori project.`);
  targetDbPath = path.join(__dirname, 'data.sqlite');
}

let db;
try {
  db = new Database(targetDbPath);
} catch (err) {
  console.warn(`[DB] Gagal membuka ${targetDbPath} (${err.message}), fallback ke ./data.sqlite.`);
  targetDbPath = path.join(__dirname, 'data.sqlite');
  db = new Database(targetDbPath);
}

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  diamonds INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  price INTEGER NOT NULL,
  is_popular INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  category TEXT DEFAULT 'diamond',
  original_price INTEGER
);`);

// Migrasi ringan untuk database lama yang belum punya kolom baru
const existingCols = db.prepare('PRAGMA table_info(products)').all().map((c) => c.name);
if (!existingCols.includes('category')) {
  db.exec("ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'diamond'");
}
if (!existingCols.includes('original_price')) {
  db.exec('ALTER TABLE products ADD COLUMN original_price INTEGER');
}
if (!existingCols.includes('digiflazz_sku')) {
  db.exec('ALTER TABLE products ADD COLUMN digiflazz_sku TEXT');
}
if (!existingCols.includes('game')) {
  db.exec("ALTER TABLE products ADD COLUMN game TEXT DEFAULT 'mobile-legends'");
}

db.exec(`

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  product_id INTEGER NOT NULL,
  game_user_id TEXT NOT NULL,
  game_zone_id TEXT NOT NULL,
  contact TEXT,
  price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  midtrans_transaction_id TEXT,
  payment_type TEXT,
  delivery_status TEXT DEFAULT 'belum_diproses',
  delivery_sn TEXT,
  delivery_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

// Migrasi ringan untuk kolom pengiriman diamond (buat database lama)
const existingOrderCols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
if (!existingOrderCols.includes('delivery_status')) {
  db.exec("ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'belum_diproses'");
}
if (!existingOrderCols.includes('delivery_sn')) {
  db.exec('ALTER TABLE orders ADD COLUMN delivery_sn TEXT');
}
if (!existingOrderCols.includes('delivery_message')) {
  db.exec('ALTER TABLE orders ADD COLUMN delivery_message TEXT');
}

module.exports = db;
