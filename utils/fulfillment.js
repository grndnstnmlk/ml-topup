const db = require('../db');
const { topupDiamond } = require('./digiflazz');
const { notifyCustomer } = require('./notify');

// Alur "order jadi lunas" yang sama dipakai di 2 tempat: webhook Midtrans
// (routes/webhook.js) DAN tombol "Tandai Lunas" manual di admin dashboard
// (routes/admin.js — dipakai kalau bayar manual lewat QRIS pribadi selagi
// akun Midtrans belum di-acc). Order harus SUDAH 'paid' di DB sebelum
// fungsi ini dipanggil — fungsi ini cuma urus notifikasi + kirim diamond.
async function fulfillPaidOrder(orderId) {
  const order = db
    .prepare(
      `SELECT orders.*, products.name AS product_name, products.digiflazz_sku
       FROM orders JOIN products ON products.id = orders.product_id
       WHERE order_id = ?`
    )
    .get(orderId);

  if (!order) return null;

  if (order.contact) {
    await notifyCustomer(order.contact, {
      subject: `Pembayaran Berhasil — ${orderId}`,
      message: `Pembayaran kamu untuk ${order.product_name} (Order ${orderId}) sudah berhasil! Diamond akan segera diproses ke akun ${order.game_user_id} (${order.game_zone_id}). Terima kasih sudah top up di JAGESTORE.`,
      html: `<p>Halo,</p><p>Pembayaran kamu untuk <b>${order.product_name}</b> (Order <b>${orderId}</b>) sudah berhasil!</p><p>Diamond akan segera diproses ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p><p>Terima kasih sudah top up di JAGESTORE.</p>`,
    });
  }

  if (!order.digiflazz_sku) {
    console.warn(`[digiflazz] Order ${orderId}: produk belum punya digiflazz_sku, lewati pengiriman otomatis.`);
    return order;
  }

  const customerNo = `${order.game_user_id}${order.game_zone_id}`;

  const result = await topupDiamond({
    sku: order.digiflazz_sku,
    customerNo,
    refId: orderId, // pakai order_id sebagai ref_id, biar gampang di-match webhook Digiflazz nanti
  });

  db.prepare(
    `UPDATE orders SET delivery_status = ?, delivery_sn = ?, delivery_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`
  ).run(result.status, result.sn || null, result.message || null, orderId);

  console.log(`[digiflazz] Order ${orderId}: ${result.status} — ${result.message}`);

  // Kalau langsung sukses/gagal (bukan pending/diproses), kabari pelanggan sekarang.
  // Kalau masih 'diproses', biarkan webhook Digiflazz (/api/digiflazz-webhook) yang update nanti.
  if (result.status === 'terkirim' && order.contact) {
    await notifyCustomer(order.contact, {
      subject: `Diamond Sudah Masuk — ${orderId}`,
      message: `Diamond untuk Order ${orderId} sudah berhasil masuk ke akun ${order.game_user_id} (${order.game_zone_id}). Selamat bermain!`,
      html: `<p>Diamond untuk Order <b>${orderId}</b> sudah berhasil masuk ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p><p>Selamat bermain!</p>`,
    });
  } else if (result.status === 'gagal' && order.contact) {
    await notifyCustomer(order.contact, {
      subject: `Pengiriman Diamond Gagal — ${orderId}`,
      message: `Pengiriman diamond untuk Order ${orderId} gagal diproses (${result.message}). Tim kami akan segera menindaklanjuti — dana kamu aman.`,
      html: `<p>Pengiriman diamond untuk Order <b>${orderId}</b> gagal diproses (${result.message}).</p><p>Tim kami akan segera menindaklanjuti — dana kamu aman.</p>`,
    });
  }

  return order;
}

module.exports = { fulfillPaidOrder };
