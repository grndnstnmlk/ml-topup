// Kirim ulang diamond secara manual untuk 1 order tertentu — dipakai kalau
// pengiriman otomatis sempat ke-skip (misalnya produk belum punya
// digiflazz_sku saat itu, atau ada error sementara ke Digiflazz).
//
// Cara pakai:
//   node scripts/retry-delivery.js MLTOP-xxxxxxxxxx
//
// PENTING: jalankan ini di environment yang sama dengan production
// (DB_PATH, DIGIFLAZZ_* harus sama seperti di Railway). Kalau kamu jalankan
// di Railway, bisa lewat tab "Shell"/"Run Command" di dashboard Railway.

require('dotenv').config();
const db = require('../db');
const { topupDiamond } = require('../utils/digiflazz');
const { notifyCustomer } = require('../utils/notify');

const orderId = process.argv[2];

if (!orderId) {
  console.error('Pakai: node scripts/retry-delivery.js <ORDER_ID>');
  process.exit(1);
}

async function main() {
  const order = db
    .prepare(
      `SELECT orders.*, products.name AS product_name, products.digiflazz_sku
       FROM orders JOIN products ON products.id = orders.product_id
       WHERE order_id = ?`
    )
    .get(orderId);

  if (!order) {
    console.error(`Order ${orderId} tidak ditemukan.`);
    process.exit(1);
  }

  if (order.status !== 'paid') {
    console.error(`Order ${orderId} statusnya "${order.status}" (bukan "paid"). Dibatalkan demi keamanan — pastikan pembayaran memang sudah lunas dulu.`);
    process.exit(1);
  }

  if (order.delivery_status === 'terkirim') {
    console.error(`Order ${orderId} sudah berstatus "terkirim" sebelumnya. Kalau memang mau kirim ulang paksa, edit script ini atau hubungi CS Digiflazz (bisa double-charge saldo kalau dikirim dua kali!).`);
    process.exit(1);
  }

  if (!order.digiflazz_sku) {
    console.error(`Produk untuk order ${orderId} masih belum punya digiflazz_sku. Isi dulu SKU-nya di db-seed.js / database, baru jalankan ulang script ini.`);
    process.exit(1);
  }

  const customerNo = `${order.game_user_id}${order.game_zone_id}`;
  console.log(`Mengirim ulang: ${order.product_name} ke ${customerNo} (order ${orderId})...`);

  const result = await topupDiamond({
    sku: order.digiflazz_sku,
    customerNo,
    refId: orderId,
  });

  db.prepare(
    `UPDATE orders SET delivery_status = ?, delivery_sn = ?, delivery_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`
  ).run(result.status, result.sn || null, result.message || null, orderId);

  console.log(`Hasil: ${result.status} — ${result.message}`);

  if (result.status === 'terkirim' && order.contact) {
    await notifyCustomer(order.contact, {
      subject: `Diamond Sudah Masuk — ${orderId}`,
      message: `Diamond untuk Order ${orderId} sudah berhasil masuk ke akun ${order.game_user_id} (${order.game_zone_id}). Selamat bermain!`,
      html: `<p>Diamond untuk Order <b>${orderId}</b> sudah berhasil masuk ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p><p>Selamat bermain!</p>`,
    });
    console.log('Notifikasi ke pelanggan terkirim.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Gagal:', err);
  process.exit(1);
});
