const db = require('./db');

// Kategori: 'diamond' (paket reguler), 'first_topup' (bonus 2x, sekali per akun baru),
// 'weekly_pass' (Weekly Diamond Pass, kelipatan)
// digiflazz_sku: kode produk (buyer_sku_code) di akun Digiflazz kamu, dipakai untuk
// pengiriman diamond otomatis. Kosongkan (null) kalau belum ada SKU-nya.
const products = [
  // ---- Paket Diamond kecil ----
  { name: '5 Diamonds',    diamonds: 5,    bonus: 0,  price: 1472,  sku: 'ml5' },
  { name: '10 Diamonds',   diamonds: 10,   bonus: 1,  price: 2995,  sku: 'ml10' },
  { name: '12 Diamonds',   diamonds: 12,   bonus: 1,  price: 3433,  sku: 'ml12' },
  { name: '14 Diamonds',   diamonds: 14,   bonus: 1,  price: 3993,  sku: 'ml14' },
  { name: '18 Diamonds',   diamonds: 18,   bonus: 1,  price: 4991,  sku: 'ml18' },
  { name: '19 Diamonds',   diamonds: 19,   bonus: 2,  price: 5397,  sku: 'ml19' },
  { name: '28 Diamonds',   diamonds: 28,   bonus: 3,  price: 7848,  sku: 'ml28' },
  { name: '36 Diamonds',   diamonds: 36,   bonus: 3,  price: 9979,  sku: 'ml36' },
  { name: '44 Diamonds',   diamonds: 44,   bonus: 4,  price: 11771, sku: 'ml44' },
  { name: '54 Diamonds',   diamonds: 54,   bonus: 5,  price: 14766, sku: 'ml54' },
  { name: '59 Diamonds',   diamonds: 59,   bonus: 6,  price: 15696, sku: 'ml59' },
  { name: '74 Diamonds',   diamonds: 74,   bonus: 7,  price: 19957, sku: 'ml74' },
  { name: '85 Diamonds',   diamonds: 85,   bonus: 8,  price: 22563, sku: 'ml85' },
  { name: '113 Diamonds',  diamonds: 113,  bonus: 11, price: 30613, sku: 'ml113' },
  { name: '170 Diamonds',  diamonds: 170,  bonus: 16, price: 45124, sku: 'ml170' },
  { name: '222 Diamonds',  diamonds: 222,  bonus: 22, price: 59868, sku: 'ml222' },
  { name: '240 Diamonds',  diamonds: 240,  bonus: 23, price: 63727, sku: 'ml240' },
  { name: '278 Diamonds',  diamonds: 278,  bonus: 27, price: 74835, sku: 'ml278' },

  // ---- Paket Diamond menengah / besar ----
  { name: '296 Diamonds',   diamonds: 296,   bonus: 40,   price: 78432,  sku: 'ml296' },
  { name: '370 Diamonds',   diamonds: 370,   bonus: 37,   price: 99779,  sku: 'ml370' },
  { name: '408 Diamonds',   diamonds: 408,   bonus: 41,   price: 107844, sku: 'ml408' },
  { name: '568 Diamonds',   diamonds: 568,   bonus: 65,   price: 147060, sku: 'ml568' },
  { name: '716 Diamonds',   diamonds: 716,   bonus: 79,   price: 186972, sku: 'ml716', popular: 1 },
  { name: '875 Diamonds',   diamonds: 875,   bonus: 101,  price: 225491, sku: 'ml875' },
  { name: '966 Diamonds',   diamonds: 966,   bonus: 130,  price: 249446, sku: 'ml966' },
  { name: '1136 Diamonds',  diamonds: 1136,  bonus: 130,  price: 294119, sku: 'ml1136', popular: 1 },
  { name: '1704 Diamonds',  diamonds: 1704,  bonus: 195,  price: 441178, sku: 'ml1704' },
  { name: '2010 Diamonds',  diamonds: 2010,  bonus: 302,  price: 490197, sku: 'ml2010' },
  { name: '4020 Diamonds',  diamonds: 4020,  bonus: 604,  price: 980394, sku: 'ml4020' },
  { name: '4830 Diamonds',  diamonds: 4830,  bonus: 827,  price: 1176470, sku: 'mlpp4830' },
  { name: '6030 Diamonds',  diamonds: 6030,  bonus: 906,  price: 1470590, sku: 'ml6030' },
  { name: '8040 Diamonds',  diamonds: 8040,  bonus: 1208, price: 1960787, sku: 'ml8040' },
  { name: '9660 Diamonds',  diamonds: 9660,  bonus: 1654, price: 2352939, sku: 'ml9660' },
  { name: '10050 Diamonds', diamonds: 10050, bonus: 1510, price: 2450983, sku: 'ml10050' },
  { name: '16080 Diamonds', diamonds: 16080, bonus: 2416, price: 3921573, sku: 'ml16080' },
  { name: '20100 Diamonds', diamonds: 20100, bonus: 3020, price: 4901966, sku: 'ml20100' },

  // ---- First Top Up (Double Diamonds) — bonus 2x, khusus akun yang belum pernah top up ----
  { name: '100 Diamonds - First Top Up',  diamonds: 100,  bonus: 50,  price: 17326,  category: 'first_topup', sku: 'mlfirst50' },
  { name: '300 Diamonds - First Top Up',  diamonds: 300,  bonus: 150, price: 51814,  category: 'first_topup', sku: 'mlfirst150' },
  { name: '500 Diamonds - First Top Up',  diamonds: 500,  bonus: 250, price: 86464,  category: 'first_topup', sku: 'mlfirst250' },
  { name: '1000 Diamonds - First Top Up', diamonds: 1000, bonus: 500, price: 173737, category: 'first_topup', sku: 'mlfirst500' },

  // ---- Weekly Diamond Pass ----
  { name: 'Weekly Diamond Pass',    diamonds: 0, bonus: 0, price: 27900,  original_price: 32500,  category: 'weekly_pass', sku: 'mlweek1' },
  { name: '2x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 55900,  original_price: 65000,  category: 'weekly_pass', sku: 'mlweek2' },
  { name: '3x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 83900,  original_price: 97500,  category: 'weekly_pass', sku: 'mlweek3' },
  { name: '4x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 111800, original_price: 130000, category: 'weekly_pass', sku: 'mlweek4' },
  { name: '5x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 139800, original_price: 162500, category: 'weekly_pass', sku: 'mlweek5' },
];

const insertStmt = db.prepare(`
  INSERT INTO products (name, diamonds, bonus, price, is_popular, sort_order, category, original_price, digiflazz_sku)
  VALUES (@name, @diamonds, @bonus, @price, @popular, @sort, @category, @original_price, @sku)
`);

const updateById = db.prepare(`
  UPDATE products
  SET name = @name, diamonds = @diamonds, bonus = @bonus, price = @price,
      is_popular = @popular, sort_order = @sort, category = @category,
      original_price = @original_price, digiflazz_sku = @sku
  WHERE id = @id
`);

const findBySku = db.prepare('SELECT id FROM products WHERE digiflazz_sku = ?');
// Fallback: produk lama (dari sebelum kolom digiflazz_sku ada) tidak punya SKU
// sama sekali, jadi dicari berdasarkan nama supaya baris lama itu di-UPDATE
// (termasuk backfill SKU-nya), bukan malah bikin baris baru yang duplikat.
const findByName = db.prepare('SELECT id FROM products WHERE name = ? AND digiflazz_sku IS NULL');

// Upsert: update produk yang sudah ada (dicocokkan lewat SKU, atau lewat nama
// kalau SKU-nya belum ke-set), insert kalau benar-benar belum ada sama sekali.
// SENGAJA TIDAK menghapus produk lama — kalau ada order yang sudah pernah
// dibuat, product_id itu terikat foreign key dan menghapusnya akan gagal
// (SQLITE_CONSTRAINT_FOREIGNKEY), atau kalaupun dipaksa, riwayat order lama
// jadi rusak (product_id-nya jadi menunjuk ke baris yang sudah tidak ada).
const seedAll = db.transaction((items) => {
  items.forEach((p, i) => {
    const payload = {
      name: p.name,
      diamonds: p.diamonds,
      bonus: p.bonus || 0,
      price: p.price,
      popular: p.popular ? 1 : 0,
      sort: i,
      category: p.category || 'diamond',
      original_price: p.original_price || null,
      sku: p.sku || null,
    };

    const existing = (p.sku && findBySku.get(p.sku)) || findByName.get(p.name);
    if (existing) {
      updateById.run({ ...payload, id: existing.id });
    } else {
      insertStmt.run(payload);
    }
  });
});

seedAll(products);

// Bersih-bersih: hapus baris produk duplikat (nama sama, salah satunya belum
// punya SKU) HANYA kalau baris duplikat itu tidak pernah dipakai order manapun.
// Ini buat beresin duplikat yang mungkin sempat kebuat oleh seed versi sebelum
// perbaikan ini (yang mencocokkan produk lewat SKU saja).
const dupeCleanup = db.prepare(`
  DELETE FROM products
  WHERE digiflazz_sku IS NULL
    AND id NOT IN (SELECT DISTINCT product_id FROM orders)
    AND name IN (
      SELECT name FROM products WHERE digiflazz_sku IS NOT NULL
    )
`);
const removed = dupeCleanup.run();
if (removed.changes > 0) {
  console.log(`Membersihkan ${removed.changes} baris produk duplikat (tanpa SKU, tidak dipakai order manapun).`);
}

console.log(`Seed selesai: ${products.length} produk diperiksa (update/insert), tidak ada yang dihapus kalau masih dipakai order.`);
