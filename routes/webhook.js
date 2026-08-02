const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const db = require('../db');

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

    if (status === 'paid') {
      // TODO: Panggil API supplier diamond ML di sini (mis. Digiflazz / VIP Reseller)
      // untuk mengirim diamond secara otomatis ke akun pemain.
      // Lihat README.md bagian "Pengiriman Diamond Otomatis" untuk detail.
      console.log(`Order ${orderId} LUNAS. Siap diproses pengiriman diamond.`);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send('Error processing notification');
  }
});

module.exports = router;
