const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DB_PATH bisa diarahkan ke folder persistent volume (mis. Railway) lewat
// environment variable. Kalau tidak diset, pakai folder project seperti biasa.
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

// Pastikan foldernya ada dulu sebelum SQLite mencoba buka filenya
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
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
