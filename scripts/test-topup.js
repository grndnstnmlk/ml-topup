// Script uji coba transaksi Digiflazz sesuai instruksi CS.
// Cara pakai: node scripts/test-topup.js
// Kredensial dibaca dari file .env (lihat .env.example untuk formatnya)

require('dotenv').config();
const crypto = require('crypto');

// --- Kredensial dari CS Digiflazz (isi di file .env, JANGAN hardcode di sini) ---
const username = process.env.DIGIFLAZZ_USERNAME;
const apiKey = process.env.DIGIFLAZZ_DEV_KEY; // pakai Development Key selama status akun masih "Development Mode"

if (!username || !apiKey) {
  console.error('DIGIFLAZZ_USERNAME atau DIGIFLAZZ_DEV_KEY belum diisi di file .env');
  process.exit(1);
}

// --- Data transaksi uji coba ---
const customerNo = '087800001232'; // Nomor tujuan dari CS
const buyerSkuCode = 'xld10';       // Kode produk dari CS
const refId = `test-${Date.now()}`; // Ref ID unik setiap request

// Signature wajib: md5(username + apiKey + ref_id)
const sign = crypto
  .createHash('md5')
  .update(username + apiKey + refId)
  .digest('hex');

const payload = {
  username,
  buyer_sku_code: buyerSkuCode,
  customer_no: customerNo,
  ref_id: refId,
  testing: true, // set true karena ini transaksi uji coba
  sign,
};

console.log('Mengirim request ke Digiflazz...');
console.log(JSON.stringify(payload, null, 2));

fetch('https://api.digiflazz.com/v1/transaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then((res) => res.json())
  .then((data) => {
    console.log('\n--- Response dari Digiflazz ---');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((err) => {
    console.error('Gagal menghubungi Digiflazz:', err.message);
  });
