const db = require('./db');

const products = [
  // ---- Paket Diamond Reguler & Promo (Khusus Katalog AR Gaming Shop) ----
  { name: '5 (5+0) Diamonds',       diamonds: 5,    bonus: 0,    price: 1850,    original_price: 2200,   sku: 'ml5' },
  { name: '10 (9+1) Diamonds',      diamonds: 10,   bonus: 1,    price: 3550,    original_price: 4000,   sku: 'ml10' },
  { name: '28 (25+3) Diamonds',     diamonds: 28,   bonus: 3,    price: 9350,    original_price: 10500,  sku: 'ml28' },
  { name: '36 (33+3) Diamonds',     diamonds: 36,   bonus: 3,    price: 12350,   original_price: 13500,  sku: 'ml36' },
  { name: '54 (49+5) Diamonds',     diamonds: 54,   bonus: 5,    price: 17650,   original_price: 19500,  sku: 'ml54' },
  { name: '74 (67+7) Diamonds',     diamonds: 74,   bonus: 7,    price: 24200,   original_price: 26500,  sku: 'ml74' },
  { name: '85 (77+8) Diamonds',     diamonds: 85,   bonus: 8,    price: 26500,   original_price: 29500,  sku: 'ml85', popular: 1 },
  { name: '110 (100+10) Diamonds',  diamonds: 110,  bonus: 10,   price: 36500,   original_price: 40000,  sku: 'ml113' },
  { name: '170 (154+16) Diamonds',  diamonds: 170,  bonus: 16,   price: 52800,   original_price: 58000,  sku: 'ml170', popular: 1 },
  { name: '222 (200+22) Diamonds',  diamonds: 222,  bonus: 22,   price: 71800,   original_price: 78000,  sku: 'ml222' },
  { name: '277 (250+27) Diamonds',  diamonds: 277,  bonus: 27,   price: 85500,   original_price: 94000,  sku: 'ml278', popular: 1 },
  { name: '296 (256+40) Diamonds',  diamonds: 296,  bonus: 40,   price: 92500,   original_price: 102000, sku: 'ml296' },
  { name: '370 (333+37) Diamonds',  diamonds: 370,  bonus: 37,   price: 118500,  original_price: 130000, sku: 'ml370' },
  { name: '408 (367+41) Diamonds',  diamonds: 408,  bonus: 41,   price: 125500,  original_price: 138000, sku: 'ml408' },
  { name: '568 (503+65) Diamonds',  diamonds: 568,  bonus: 65,   price: 171500,  original_price: 188000, sku: 'ml568', popular: 1 },
  { name: '716 (637+79) Diamonds',  diamonds: 716,  bonus: 79,   price: 222500,  original_price: 245000, sku: 'ml716', popular: 1 },
  { name: '875 (774+101) Diamonds', diamonds: 875,  bonus: 101,  price: 262500,  original_price: 288000, sku: 'ml875' },
  { name: '966 (836+130) Diamonds', diamonds: 966,  bonus: 130,  price: 299000,  original_price: 328000, sku: 'ml966' },
  { name: '1136 (1006+130) Diamonds', diamonds: 1136, bonus: 130, price: 349500, original_price: 385000, sku: 'ml1136', popular: 1 },
  { name: '1704 (1509+195) Diamonds', diamonds: 1704, bonus: 195, price: 524000, original_price: 575000, sku: 'ml1704' },
  { name: '2010 (1708+302) Diamonds', diamonds: 2010, bonus: 302, price: 569500, original_price: 625000, sku: 'ml2010', popular: 1 },
  { name: '4020 (3416+604) Diamonds', diamonds: 4020, bonus: 604, price: 1139000, original_price: 1250000, sku: 'ml4020' },
  { name: '6030 (5124+906) Diamonds', diamonds: 6030, bonus: 906, price: 1708000, original_price: 1880000, sku: 'ml6030' },
  { name: '8040 (6832+1208) Diamonds', diamonds: 8040, bonus: 1208, price: 2278000, original_price: 2490000, sku: 'ml8040' },

  // ---- First Top Up (Double Diamonds) — AR Gaming Shop ----
  { name: '100 (50+50) Diamonds - First Top Up',  diamonds: 100,  bonus: 50,  price: 17500,  original_price: 34000,  category: 'first_topup', sku: 'mlfirst50', popular: 1 },
  { name: '300 (150+150) Diamonds - First Top Up', diamonds: 300, bonus: 150, price: 52000,  original_price: 100000, category: 'first_topup', sku: 'mlfirst150' },
  { name: '500 (250+250) Diamonds - First Top Up', diamonds: 500, bonus: 250, price: 86800,  original_price: 170000, category: 'first_topup', sku: 'mlfirst250' },
  { name: '1000 (500+500) Diamonds - First Top Up', diamonds: 1000, bonus: 500, price: 173900, original_price: 340000, category: 'first_topup', sku: 'mlfirst500' },

  // ---- Weekly Diamond Pass — AR Gaming Shop ----
  { name: 'Weekly Diamond Pass',    diamonds: 0, bonus: 0, price: 32500,  original_price: 34000,  category: 'weekly_pass', sku: 'mlweek1', popular: 1 },
  { name: '2x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 65000,  original_price: 68000,  category: 'weekly_pass', sku: 'mlweek2' },
  { name: '3x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 97500,  original_price: 102000, category: 'weekly_pass', sku: 'mlweek3' },
  { name: '4x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 130000, original_price: 136000, category: 'weekly_pass', sku: 'mlweek4' },
  { name: '5x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 162500, original_price: 170000, category: 'weekly_pass', sku: 'mlweek5' },
];

async function seed() {
  await db.init();

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const payload = [
      p.name,
      p.diamonds,
      p.bonus || 0,
      p.price,
      p.popular ? 1 : 0,
      i,
      p.category || 'diamond',
      p.original_price || null,
      p.sku || null,
      p.game || 'mobile-legends',
    ];

    let existing = null;
    if (p.sku) {
      existing = await db.get('SELECT id FROM products WHERE digiflazz_sku = ?', [p.sku]);
    }
    if (!existing) {
      existing = await db.get('SELECT id FROM products WHERE name = ? AND digiflazz_sku IS NULL', [p.name]);
    }

    if (existing) {
      await db.run(
        `UPDATE products 
         SET name = ?, diamonds = ?, bonus = ?, price = ?, is_popular = ?, sort_order = ?, category = ?, original_price = ?, digiflazz_sku = ?, game = ? 
         WHERE id = ?`,
        [...payload, existing.id]
      );
    } else {
      await db.run(
        `INSERT INTO products (name, diamonds, bonus, price, is_popular, sort_order, category, original_price, digiflazz_sku, game) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        payload
      );
    }
  }

  const skusInSeed = products.map((p) => p.sku).filter(Boolean);
  if (skusInSeed.length > 0) {
    const placeholders = skusInSeed.map(() => '?').join(',');
    const removedOld = await db.run(
      `DELETE FROM products WHERE (digiflazz_sku NOT IN (${placeholders}) OR digiflazz_sku IS NULL) AND id NOT IN (SELECT DISTINCT product_id FROM orders)`,
      skusInSeed
    );
    if (removedOld.changes > 0) {
      console.log(`Membersihkan ${removedOld.changes} produk lama yang tidak ada di katalog.`);
    }
  }

  console.log(`Seed selesai: ${products.length} produk aktif diperiksa (update/insert).`);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('Error saat seed:', err);
    process.exit(1);
  });
}

module.exports = { seed, products };
