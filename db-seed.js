const db = require('./db');

// Kategori: 'diamond' (paket reguler), 'first_topup' (bonus 2x, sekali per akun baru),
// 'weekly_pass' (Weekly Diamond Pass, kelipatan)
// digiflazz_sku: kode produk (buyer_sku_code) di akun Digiflazz kamu, dipakai untuk
// pengiriman diamond otomatis. Kosongkan (null) kalau belum ada SKU-nya.
// game: 'mobile-legends' (default), 'free-fire', 'pubg-mobile', dst — dipakai frontend
// untuk menampilkan tab game & field ID yang sesuai (lihat GAME_CONFIG di public/js/app.js).
//
// Cara nambah game baru (mis. Free Fire):
// 1. Jalankan `node scripts/get-digiflazz-products.js "free fire"` untuk ambil daftar
//    buyer_sku_code + harga asli dari akun Digiflazz kamu (JANGAN dikira-kira sendiri).
// 2. Tambahkan produknya di array `products` di bawah, dengan `game: 'free-fire'` dan
//    `sku:` diisi buyer_sku_code asli dari hasil langkah 1.
// 3. Tambahkan entri game-nya juga di GAME_CONFIG (public/js/app.js) supaya tab & field
//    ID-nya muncul di frontend.
// 4. jalankan `npm run seed` (atau set FORCE_RESEED=true di Railway lalu redeploy).
const products = [
  // ---- Paket Diamond kecil / reguler (AR Gaming Shop) ----
  { name: '5 Diamonds',    diamonds: 5,    bonus: 0,  price: 1550,   original_price: 1800,   sku: 'ml5' },
  { name: '10 Diamonds',   diamonds: 10,   bonus: 1,  price: 3176,   original_price: 3500,   sku: 'ml10' },
  { name: '14 Diamonds',   diamonds: 14,   bonus: 1,  price: 4400,   original_price: 5000,   sku: 'ml14' },
  { name: '18 Diamonds',   diamonds: 18,   bonus: 1,  price: 5500,   original_price: 6200,   sku: 'ml18' },
  { name: '28 Diamonds',   diamonds: 28,   bonus: 3,  price: 8500,   original_price: 9500,   sku: 'ml28' },
  { name: '36 Diamonds',   diamonds: 36,   bonus: 3,  price: 11961,  original_price: 13000,  sku: 'ml36' },
  { name: '44 Diamonds',   diamonds: 44,   bonus: 4,  price: 15200,  original_price: 17000,  sku: 'ml44' },
  { name: '54 Diamonds',   diamonds: 54,   bonus: 5,  price: 16729,  original_price: 18500,  sku: 'ml54' },
  { name: '74 Diamonds',   diamonds: 74,   bonus: 7,  price: 22701,  original_price: 25000,  sku: 'ml74' },
  { name: '85 Diamonds',   diamonds: 85,   bonus: 8,  price: 27500,  original_price: 29900,  sku: 'ml85', popular: 1 },
  { name: '110 Diamonds',  diamonds: 110,  bonus: 10, price: 34268,  original_price: 38000,  sku: 'ml113' },
  { name: '170 Diamonds',  diamonds: 170,  bonus: 16, price: 52400,  original_price: 58000,  sku: 'ml170', popular: 1 },
  { name: '222 Diamonds',  diamonds: 222,  bonus: 22, price: 68101,  original_price: 75000,  sku: 'ml222' },

  // ---- Paket Diamond menengah / besar ----
  { name: '277 Diamonds',   diamonds: 277,   bonus: 27,   price: 85100,   original_price: 94000,   sku: 'ml278', popular: 1 },
  { name: '296 Diamonds',   diamonds: 296,   bonus: 40,   price: 91000,   original_price: 100000,  sku: 'ml296' },
  { name: '370 Diamonds',   diamonds: 370,   bonus: 37,   price: 113033,  original_price: 125000,  sku: 'ml370' },
  { name: '408 Diamonds',   diamonds: 408,   bonus: 41,   price: 119000,  original_price: 132000,  sku: 'ml408' },
  { name: '568 Diamonds',   diamonds: 568,   bonus: 65,   price: 172000,  original_price: 189000,  sku: 'ml568', popular: 1 },
  { name: '716 Diamonds',   diamonds: 716,   bonus: 79,   price: 214236,  original_price: 235000,  sku: 'ml716', popular: 1 },
  { name: '875 Diamonds',   diamonds: 875,   bonus: 101,  price: 239000,  original_price: 265000,  sku: 'ml875' },
  { name: '966 Diamonds',   diamonds: 966,   bonus: 130,  price: 289522,  original_price: 318000,  sku: 'ml966' },
  { name: '1136 Diamonds',  diamonds: 1136,  bonus: 130,  price: 337194,  original_price: 370000,  sku: 'ml1136', popular: 1 },
  { name: '1704 Diamonds',  diamonds: 1704,  bonus: 195,  price: 505791,  original_price: 555000,  sku: 'ml1704' },
  { name: '2010 Diamonds',  diamonds: 2010,  bonus: 302,  price: 562000,  original_price: 615000,  sku: 'ml2010', popular: 1 },
  { name: '4020 Diamonds',  diamonds: 4020,  bonus: 604,  price: 1123599, original_price: 1230000, sku: 'ml4020' },
  { name: '4830 Diamonds',  diamonds: 4830,  bonus: 827,  price: 1280000, original_price: 1400000, sku: 'ml4830' },
  { name: '6030 Diamonds',  diamonds: 6030,  bonus: 906,  price: 1685398, original_price: 1850000, sku: 'ml6030' },
  { name: '8040 Diamonds',  diamonds: 8040,  bonus: 1208, price: 2247197, original_price: 2460000, sku: 'ml8040' },
  { name: '9660 Diamonds',  diamonds: 9660,  bonus: 1654, price: 2490000, original_price: 2750000, sku: 'ml9660' },
  { name: '10050 Diamonds', diamonds: 10050, bonus: 1510, price: 2850000, original_price: 3100000, sku: 'ml10050' },

  // ---- First Top Up (Double Diamonds) — bonus 2x, khusus akun yang belum pernah top up ----
  { name: '100 Diamonds - First Top Up',  diamonds: 100,  bonus: 50,  price: 16659,  original_price: 33000,  category: 'first_topup', sku: 'mlfirst50', popular: 1 },
  { name: '300 Diamonds - First Top Up',  diamonds: 300,  bonus: 150, price: 49780,  original_price: 99000,  category: 'first_topup', sku: 'mlfirst150' },
  { name: '500 Diamonds - First Top Up',  diamonds: 500,  bonus: 250, price: 83098,  original_price: 165000, category: 'first_topup', sku: 'mlfirst250' },
  { name: '1000 Diamonds - First Top Up', diamonds: 1000, bonus: 500, price: 167183, original_price: 330000, category: 'first_topup', sku: 'mlfirst500' },

  // ---- Weekly Diamond Pass ----
  { name: 'Weekly Diamond Pass',    diamonds: 0, bonus: 0, price: 31500,  original_price: 32500,  category: 'weekly_pass', sku: 'mlweek1', popular: 1 },
  { name: '2x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 63000,  original_price: 65000,  category: 'weekly_pass', sku: 'mlweek2' },
  { name: '3x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 94500,  original_price: 97500,  category: 'weekly_pass', sku: 'mlweek3' },
  { name: '4x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 126000, original_price: 130000, category: 'weekly_pass', sku: 'mlweek4' },
  { name: '5x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 157500, original_price: 162500, category: 'weekly_pass', sku: 'mlweek5' },
];

const insertStmt = db.prepare(`
  INSERT INTO products (name, diamonds, bonus, price, is_popular, sort_order, category, original_price, digiflazz_sku, game)
  VALUES (@name, @diamonds, @bonus, @price, @popular, @sort, @category, @original_price, @sku, @game)
`);

const updateById = db.prepare(`
  UPDATE products
  SET name = @name, diamonds = @diamonds, bonus = @bonus, price = @price,
      is_popular = @popular, sort_order = @sort, category = @category,
      original_price = @original_price, digiflazz_sku = @sku, game = @game
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
      game: p.game || 'mobile-legends',
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

// Bersih-bersih: hapus produk yang sudah tidak ada di katalog seed saat ini
// HANYA jika produk tersebut belum pernah dipakai oleh order manapun.
const skusInSeed = products.map((p) => p.sku).filter(Boolean);
if (skusInSeed.length > 0) {
  const placeholders = skusInSeed.map(() => '?').join(',');
  const cleanupOld = db.prepare(`
    DELETE FROM products
    WHERE (digiflazz_sku NOT IN (${placeholders}) OR digiflazz_sku IS NULL)
      AND id NOT IN (SELECT DISTINCT product_id FROM orders)
  `);
  const removedOld = cleanupOld.run(...skusInSeed);
  if (removedOld.changes > 0) {
    console.log(`Membersihkan ${removedOld.changes} produk lama yang tidak ada di katalog saat ini.`);
  }
}

console.log(`Seed selesai: ${products.length} produk aktif diperiksa (update/insert).`);
