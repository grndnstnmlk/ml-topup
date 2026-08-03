// Diagnostik: cari produk "yatim" — baris di tabel products yang belum
// punya digiflazz_sku (biasanya sisa dari perubahan nama/harga katalog
// sebelumnya), dan tunjukkan order apa saja yang mereferensikan produk itu.
//
// Cara pakai (jalankan di environment yang sama dengan production,
// misalnya lewat Railway Shell):
//   node scripts/list-orphans.js

require('dotenv').config();
const db = require('../db');

const orphans = db
  .prepare(
    "SELECT id, name, diamonds, bonus, price, category FROM products WHERE digiflazz_sku IS NULL OR digiflazz_sku = ''"
  )
  .all();

if (orphans.length === 0) {
  console.log('Tidak ada produk yatim. Semua produk sudah punya digiflazz_sku. ✅');
  process.exit(0);
}

console.log(`Ditemukan ${orphans.length} produk yatim (belum punya digiflazz_sku):\n`);

const orderCountStmt = db.prepare(
  "SELECT COUNT(*) AS c FROM orders WHERE product_id = ?"
);
const unpaidOrDeliveredStmt = db.prepare(
  `SELECT order_id, status, delivery_status, created_at
   FROM orders WHERE product_id = ? ORDER BY created_at DESC LIMIT 5`
);

orphans.forEach((p) => {
  const orderCount = orderCountStmt.get(p.id).c;
  console.log(`— [id=${p.id}] "${p.name}" (${p.diamonds}+${p.bonus} diamond, Rp${p.price}, kategori: ${p.category})`);
  console.log(`  Dipakai di ${orderCount} order.`);
  if (orderCount > 0) {
    const recent = unpaidOrDeliveredStmt.all(p.id);
    recent.forEach((o) => {
      console.log(`    · ${o.order_id} — status=${o.status}, delivery=${o.delivery_status}, ${o.created_at}`);
    });
  }
  console.log('');
});

console.log('Produk-produk ini SUDAH otomatis disembunyikan dari toko (lihat routes/products.js),');
console.log('jadi tidak akan ada order baru yang masuk ke sini lagi. Untuk order LAMA yang');
console.log('statusnya "paid" tapi delivery masih tertahan, samakan digiflazz_sku-nya secara manual, contoh:');
console.log('');
console.log("  UPDATE products SET digiflazz_sku = 'ml_KODE_YANG_BENAR' WHERE id = ID_DI_ATAS;");
console.log('');
console.log('Lalu jalankan: node scripts/retry-delivery.js <ORDER_ID> untuk kirim ulang diamond-nya.');

process.exit(0);
