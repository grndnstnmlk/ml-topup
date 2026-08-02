const db = require('./db');

const products = [
  { name: 'Diamond 86',    diamonds: 86,   bonus: 0,  price: 22000  },
  { name: 'Diamond 172',   diamonds: 172,  bonus: 0,  price: 44000  },
  { name: 'Diamond 257',   diamonds: 257,  bonus: 0,  price: 66000  },
  { name: 'Diamond 344',   diamonds: 344,  bonus: 0,  price: 88000  },
  { name: 'Diamond 429',   diamonds: 429,  bonus: 0,  price: 110000, popular: 1 },
  { name: 'Diamond 514',   diamonds: 514,  bonus: 0,  price: 132000 },
  { name: 'Diamond 706',   diamonds: 706,  bonus: 30, price: 176000, popular: 1 },
  { name: 'Diamond 878',   diamonds: 878,  bonus: 40, price: 220000 },
  { name: 'Diamond 963',   diamonds: 963,  bonus: 45, price: 242000 },
  { name: 'Diamond 1050',  diamonds: 1050, bonus: 50, price: 264000 },
  { name: 'Diamond 1412',  diamonds: 1412, bonus: 70, price: 352000 },
  { name: 'Diamond 2195',  diamonds: 2195, bonus: 110,price: 528000 },
  { name: 'Weekly Pass',   diamonds: 0,    bonus: 0,  price: 29000  },
  { name: 'Twilight Pass', diamonds: 0,    bonus: 0,  price: 149000, popular: 1 },
];

const insert = db.prepare(`
  INSERT INTO products (name, diamonds, bonus, price, is_popular, sort_order)
  VALUES (@name, @diamonds, @bonus, @price, @popular, @sort)
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
  });
});

console.log(`Seeded ${products.length} produk diamond ke database.`);
