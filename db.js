const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const isTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

let client;

if (isTurso) {
  console.log('[DB] Menggunakan Turso Cloud SQLite Database 🌐');
  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  let dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } catch (e) {
    dbPath = path.join(__dirname, 'data.sqlite');
  }
  console.log(`[DB] Menggunakan Database SQLite Lokal: ${dbPath} 💾`);
  client = createClient({
    url: `file:${dbPath.replace(/\\/g, '/')}`,
  });
}

const db = {
  client,
  isTurso,

  async all(sql, args = []) {
    const rs = await client.execute({ sql, args: Array.isArray(args) ? args : [args] });
    return rs.rows;
  },

  async get(sql, args = []) {
    const rs = await client.execute({ sql, args: Array.isArray(args) ? args : [args] });
    return rs.rows && rs.rows.length > 0 ? rs.rows[0] : null;
  },

  async run(sql, args = []) {
    const rs = await client.execute({ sql, args: Array.isArray(args) ? args : [args] });
    return {
      lastInsertRowid: rs.lastInsertRowid,
      changes: rs.rowsAffected,
    };
  },

  async exec(sql) {
    return await client.executeMultiple(sql);
  },

  async batch(statements) {
    return await client.batch(statements);
  },

  async init() {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        diamonds INTEGER NOT NULL,
        bonus INTEGER DEFAULT 0,
        price INTEGER NOT NULL,
        is_popular INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        category TEXT DEFAULT 'diamond',
        original_price INTEGER,
        digiflazz_sku TEXT,
        game TEXT DEFAULT 'mobile-legends'
      );
    `);

    await client.execute(`
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
  }
};

module.exports = db;
