const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  diamonds INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  price INTEGER NOT NULL,
  is_popular INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

module.exports = db;
