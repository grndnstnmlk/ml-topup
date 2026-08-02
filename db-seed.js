const db = require('./db');

// Kategori: 'diamond' (paket reguler), 'first_topup' (bonus 2x, sekali per akun baru),
// 'weekly_pass' (Weekly Diamond Pass, kelipatan)
const products = [
  // ---- Paket Diamond kecil ----
  { name: '5 Diamonds',    diamonds: 5,    bonus: 0,  price: 1472 },
  { name: '10 Diamonds',   diamonds: 10,   bonus: 1,  price: 2995 },
  { name: '12 Diamonds',   diamonds: 12,   bonus: 1,  price: 3433 },
  { name: '14 Diamonds',   diamonds: 14,   bonus: 1,  price: 3993 },
  { name: '18 Diamonds',   diamonds: 18,   bonus: 1,  price: 4991 },
  { name: '19 Diamonds',   diamonds: 19,   bonus: 2,  price: 5397 },
  { name: '28 Diamonds',   diamonds: 28,   bonus: 3,  price: 7848 },
  { name: '36 Diamonds',   diamonds: 36,   bonus: 3,  price: 9979 },
  { name: '44 Diamonds',   diamonds: 44,   bonus: 4,  price: 11771 },
  { name: '54 Diamonds',   diamonds: 54,   bonus: 5,  price: 14766 },
  { name: '59 Diamonds',   diamonds: 59,   bonus: 6,  price: 15696 },
  { name: '74 Diamonds',   diamonds: 74,   bonus: 7,  price: 19957 },
  { name: '85 Diamonds',   diamonds: 85,   bonus: 8,  price: 22563 },
  { name: '110 Diamonds',  diamonds: 110,  bonus: 10, price: 29935 },
  { name: '170 Diamonds',  diamonds: 170,  bonus: 16, price: 45124 },
  { name: '222 Diamonds',  diamonds: 222,  bonus: 22, price: 59868 },
  { name: '240 Diamonds',  diamonds: 240,  bonus: 23, price: 63727 },
  { name: '277 Diamonds',  diamonds: 277,  bonus: 27, price: 74835 },

  // ---- Paket Diamond menengah / besar ----
  { name: '296 Diamonds',   diamonds: 296,   bonus: 40,   price: 78432 },
  { name: '370 Diamonds',   diamonds: 370,   bonus: 37,   price: 99779 },
  { name: '408 Diamonds',   diamonds: 408,   bonus: 41,   price: 107844 },
  { name: '568 Diamonds',   diamonds: 568,   bonus: 65,   price: 147060 },
  { name: '716 Diamonds',   diamonds: 716,   bonus: 79,   price: 186972, popular: 1 },
  { name: '875 Diamonds',   diamonds: 875,   bonus: 101,  price: 225491 },
  { name: '966 Diamonds',   diamonds: 966,   bonus: 130,  price: 249446 },
  { name: '1136 Diamonds',  diamonds: 1136,  bonus: 130,  price: 294119, popular: 1 },
  { name: '1704 Diamonds',  diamonds: 1704,  bonus: 195,  price: 441178 },
  { name: '2010 Diamonds',  diamonds: 2010,  bonus: 302,  price: 490197 },
  { name: '4020 Diamonds',  diamonds: 4020,  bonus: 604,  price: 980394 },
  { name: '4830 Diamonds',  diamonds: 4830,  bonus: 827,  price: 1176470 },
  { name: '6030 Diamonds',  diamonds: 6030,  bonus: 906,  price: 1470590 },
  { name: '8040 Diamonds',  diamonds: 8040,  bonus: 1208, price: 1960787 },
  { name: '9660 Diamonds',  diamonds: 9660,  bonus: 1654, price: 2352939 },
  { name: '10050 Diamonds', diamonds: 10050, bonus: 1510, price: 2450983 },
  { name: '16080 Diamonds', diamonds: 16080, bonus: 2416, price: 3921573 },
  { name: '20100 Diamonds', diamonds: 20100, bonus: 3020, price: 4901966 },

  // ---- First Top Up (Double Diamonds) — bonus 2x, khusus akun yang belum pernah top up ----
  { name: '100 Diamonds - First Top Up',  diamonds: 100,  bonus: 50,  price: 17326,  category: 'first_topup' },
  { name: '300 Diamonds - First Top Up',  diamonds: 300,  bonus: 150, price: 51814,  category: 'first_topup' },
  { name: '500 Diamonds - First Top Up',  diamonds: 500,  bonus: 250, price: 86464,  category: 'first_topup' },
  { name: '1000 Diamonds - First Top Up', diamonds: 1000, bonus: 500, price: 173737, category: 'first_topup' },

  // ---- Weekly Diamond Pass ----
  { name: 'Weekly Diamond Pass',    diamonds: 0, bonus: 0, price: 27900,  original_price: 32500,  category: 'weekly_pass' },
  { name: '2x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 55900,  original_price: 65000,  category: 'weekly_pass' },
  { name: '3x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 83900,  original_price: 97500,  category: 'weekly_pass' },
  { name: '4x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 111800, original_price: 130000, category: 'weekly_pass' },
  { name: '5x Weekly Diamond Pass', diamonds: 0, bonus: 0, price: 139800, original_price: 162500, category: 'weekly_pass' },
];

const insert = db.prepare(`
  INSERT INTO products (name, diamonds, bonus, price, is_popular, sort_order, category, original_price)
  VALUES (@name, @diamonds, @bonus, @price, @popular, @sort, @category, @original_price)
`);

const clear = db.prepare('DELETE FROM products');
clear.run();

products.forEach((p, i) => {
  insert.run({
    name: p.name,
    diamonds: p.diamonds,
    bonus: p.bonus || 0,
    price: p.price,
    popular: p.popular ? 1 : 0,
    sort: i,
    category: p.category || 'diamond',
    original_price: p.original_price || null,
  });
});

console.log(`Seeded ${products.length} produk diamond ke database.`);
