const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const db = require('../db');
const { notifyCustomer } = require('../utils/notify');
const { topupDiamond } = require('../utils/digiflazz');

const core = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// POST /api/webhook/midtrans - dipanggil otomatis oleh Midtrans saat status
// pembayaran berubah. Daftarkan URL ini di dashboard Midtrans:
// Settings > Configuration > Payment Notification URL
router.post('/midtrans', async (req, res) => {
  try {
    const notification = await core.transaction.notification(req.body);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const paymentType = notification.payment_type;
    const transactionId = notification.transaction_id;

    let status = 'pending';

    if (transactionStatus === 'capture') {
      status = fraudStatus === 'accept' ? 'paid' : 'pending';
    } else if (transactionStatus === 'settlement') {
      status = 'paid';
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      status = 'failed';
    } else if (transactionStatus === 'pending') {
      status = 'pending';
    }

    db.prepare(
      `UPDATE orders
       SET status = ?, midtrans_transaction_id = ?, payment_type = ?, updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`
    ).run(status, transactionId, paymentType, orderId);

    const order = db
      .prepare(
        `SELECT orders.*, products.name AS product_name, products.digiflazz_sku
         FROM orders JOIN products ON products.id = orders.product_id
         WHERE order_id = ?`
      )
      .get(orderId);

    if (order && order.contact) {
      if (status === 'paid') {
        await notifyCustomer(order.contact, {
          subject: `Pembayaran Berhasil — ${orderId}`,
          message: `Pembayaran kamu untuk ${order.product_name} (Order ${orderId}) sudah berhasil! Diamond akan segera diproses ke akun ${order.game_user_id} (${order.game_zone_id}). Terima kasih sudah top up di JAGESTORE.`,
          html: `<p>Halo,</p><p>Pembayaran kamu untuk <b>${order.product_name}</b> (Order <b>${orderId}</b>) sudah berhasil!</p><p>Diamond akan segera diproses ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p><p>Terima kasih sudah top up di JAGESTORE.</p>`,
        });
      } else if (status === 'failed') {
        await notifyCustomer(order.contact, {
          subject: `Pembayaran Gagal — ${orderId}`,
          message: `Pembayaran untuk Order ${orderId} gagal/dibatalkan. Kalau ini keliru, silakan coba pesan ulang di website kami.`,
          html: `<p>Pembayaran untuk Order <b>${orderId}</b> gagal atau dibatalkan.</p><p>Kalau ini keliru, silakan coba pesan ulang di website kami.</p>`,
        });
      }
    }

    if (status === 'paid' && order) {
      if (!order.digiflazz_sku) {
        console.warn(`[digiflazz] Order ${orderId}: produk belum punya digiflazz_sku, lewati pengiriman otomatis.`);
      } else {
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
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send('Error processing notification');
  }
});

module.exports = router;
