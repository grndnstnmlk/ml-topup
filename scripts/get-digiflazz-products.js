// Ambil daftar harga & buyer_sku_code produk dari akun Digiflazz kamu, difilter
// berdasarkan nama brand (mis. "mobile legend", "free fire", "pubg mobile").
// Cara pakai:
//   node scripts/get-digiflazz-products.js                  -> default: mobile legend
//   node scripts/get-digiflazz-products.js "free fire"
//   node scripts/get-digiflazz-products.js "pubg mobile"

require('dotenv').config();
const crypto = require('crypto');

const username = process.env.DIGIFLAZZ_USERNAME;
const apiKey = process.env.DIGIFLAZZ_DEV_KEY; // pakai Development Key dulu selama testing
const brandFilter = (process.argv[2] || 'mobile legend').toLowerCase();

if (!username || !apiKey) {
  console.error('DIGIFLAZZ_USERNAME atau DIGIFLAZZ_DEV_KEY belum diisi di .env');
  process.exit(1);
}

const sign = crypto.createHash('md5').update(username + apiKey + 'pricelist').digest('hex');

async function main() {
  const res = await fetch('https://api.digiflazz.com/v1/price-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: 'prepaid', username, sign }),
  });

  const json = await res.json();

  if (!json.data) {
    console.log('Respons tidak terduga:', JSON.stringify(json, null, 2));
    return;
  }

  const matched = json.data.filter(
    (p) => p.brand && p.brand.toLowerCase().includes(brandFilter)
  );

  if (!matched.length) {
    console.log(`Tidak ada produk dengan brand mengandung "${brandFilter}" ditemukan di akun kamu.`);
    console.log('Total produk lain yang tersedia:', json.data.length);
    console.log('Coba cek daftar brand yang ada, contoh:', [...new Set(json.data.map((p) => p.brand))].slice(0, 15).join(', '));
    return;
  }

  console.log(`Ditemukan ${matched.length} produk dengan brand mengandung "${brandFilter}":\n`);
  console.log(
    'buyer_sku_code'.padEnd(20),
    'product_name'.padEnd(35),
    'price'.padEnd(12),
    'status'
  );
  console.log('-'.repeat(80));

  matched.forEach((p) => {
    console.log(
      String(p.buyer_sku_code).padEnd(20),
      String(p.product_name).padEnd(35),
      String(p.price).padEnd(12),
      p.buyer_product_status ? 'aktif' : 'nonaktif'
    );
  });
}

main().catch((err) => console.error('Gagal ambil price list:', err.message));
