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
  // ---- Paket Diamond kecil ----
  { name: '5 Diamonds',    diamonds: 5,    bonus: 0,  price: 1529,  sku: 'ml5' },
  { name: '10 Diamonds',   diamonds: 10,   bonus: 1,  price: 3058,  sku: 'ml10' },
  { name: '12 Diamonds',   diamonds: 12,   bonus: 1,  price: 3838,  sku: 'ml12' },
  { name: '19 Diamonds',   diamonds: 19,   bonus: 2,  price: 5948,  sku: 'ml19' },
  { name: '28 Diamonds',   diamonds: 28,   bonus: 3,  price: 8634,  sku: 'ml28' },
  { name: '36 Diamonds',   diamonds: 36,   bonus: 3,  price: 11514, sku: 'ml36' },
  { name: '44 Diamonds',   diamonds: 44,   bonus: 4,  price: 13046, sku: 'ml44' },
  { name: '54 Diamonds',   diamonds: 54,   bonus: 5,  price: 16104, sku: 'ml54' },
  { name: '59 Diamonds',   diamonds: 59,   bonus: 6,  price: 17266, sku: 'ml59' },
  { name: '74 Diamonds',   diamonds: 74,   bonus: 7,  price: 21852, sku: 'ml74' },
  { name: '85 Diamonds',   diamonds: 85,   bonus: 8,  price: 24940, sku: 'ml85' },
  { name: '110 Diamonds',  diamonds: 110,  bonus: 10, price: 32987, sku: 'ml113' },
  { name: '170 Diamonds',  diamonds: 170,  bonus: 16, price: 49446, sku: 'ml170' },
  { name: '222 Diamonds',  diamonds: 222,  bonus: 22, price: 65555, sku: 'ml222' },
  { name: '240 Diamonds',  diamonds: 240,  bonus: 23, price: 69868, sku: 'ml240' },

  // ---- Paket Diamond menengah / besar ----
  { name: '278 Diamonds',   diamonds: 278,   bonus: 27,   price: 81918,   sku: 'ml278' },
  { name: '296 Diamonds',   diamonds: 296,   bonus: 40,   price: 86099,   sku: 'ml296' },
  { name: '370 Diamonds',   diamonds: 370,   bonus: 37,   price: 108808,  sku: 'ml370' },
  { name: '408 Diamonds',   diamonds: 408,   bonus: 41,   price: 118937,  sku: 'ml408' },
  { name: '568 Diamonds',   diamonds: 568,   bonus: 65,   price: 162295,  sku: 'ml568' },
  { name: '716 Diamonds',   diamonds: 716,   bonus: 79,   price: 206227,  sku: 'ml716', popular: 1 },
  { name: '875 Diamonds',   diamonds: 875,   bonus: 101,  price: 248796,  sku: 'ml875' },
  { name: '966 Diamonds',   diamonds: 966,   bonus: 130,  price: 278699,  sku: 'ml966' },
  { name: '1136 Diamonds',  diamonds: 1136,  bonus: 130,  price: 324589,  sku: 'ml1136', popular: 1 },
  { name: '1704 Diamonds',  diamonds: 1704,  bonus: 195,  price: 486883,  sku: 'ml1704' },
  { name: '2010 Diamonds',  diamonds: 2010,  bonus: 302,  price: 540798,  sku: 'ml2010' },
  { name: '4020 Diamonds',  diamonds: 4020,  bonus: 604,  price: 1081595, sku: 'ml4020' },
  { name: '4830 Diamonds',  diamonds: 4830,  bonus: 827,  price: 1297767, sku: 'mlpp4830' },
  { name: '6030 Diamonds',  diamonds: 6030,  bonus: 906,  price: 1622393, sku: 'ml6030' },
  { name: '8040 Diamonds',  diamonds: 8040,  bonus: 1208, price: 2163190, sku: 'ml8040' },
  { name: '9660 Diamonds',  diamonds: 9660,  bonus: 1654, price: 2595533, sku: 'ml9660' },
  { name: '10050 Diamonds', diamonds: 10050, bonus: 1510, price: 2703987, sku: 'ml10050' },
  { name: '16080 Diamonds', diamonds: 16080, bonus: 2416, price: 4326380, sku: 'ml16080' },
  { name: '20100 Diamonds', diamonds: 20100, bonus: 3020, price: 5407974, sku: 'ml20100' },

  // ---- First Top Up (Double Diamonds) — bonus 2x, khusus akun yang belum pernah top up ----
  { name: '100 Diamonds - First Top Up',  diamonds: 100,  bonus: 50,  price: 16037,  category: 'first_topup', sku: 'mlfirst50' },
  { name: '300 Diamonds - First Top Up',  diamonds: 300,  bonus: 150, price: 47919,  category: 'first_topup', sku: 'mlfirst150' },
  { name: '500 Diamonds - First Top Up',  diamonds: 500,  bonus: 250, price: 79991,  category: 'first_topup', sku: 'mlfirst250' },
  { name: '1000 Diamonds - First Top Up', diamonds: 1000, bonus: 500, price: 160933, category: 'first_topup', sku: 'mlfirst500' },

  // ---- Weekly Diamond Pass ----
  { name: 'Weekly Diamond Pass',    diamonds: 0, bonus: 0, price: 31010,  original_price: 32500,  category: 'weekly_pass', sku: 'mlweek1' },
  { name: '2x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 62019,  original_price: 65000,  category: 'weekly_pass', sku: 'mlweek2' },
  { name: '3x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 93028,  original_price: 97500,  category: 'weekly_pass', sku: 'mlweek3' },
  { name: '4x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 124037, original_price: 130000, category: 'weekly_pass', sku: 'mlweek4' },
  { name: '5x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 155046, original_price: 162500, category: 'weekly_pass', sku: 'mlweek5' },
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
