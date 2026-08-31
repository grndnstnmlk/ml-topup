const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const db = require('../db');
const { notifyCustomer } = require('../utils/notify');
const { fulfillPaidOrder } = require('../utils/fulfillment');

const core = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

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

    await db.run(
      `UPDATE orders
       SET status = ?, midtrans_transaction_id = ?, payment_type = ?, updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [status, transactionId, paymentType, orderId]
    );

    const order = await db.get(
      `SELECT orders.*, products.name AS product_name, products.digiflazz_sku
       FROM orders JOIN products ON products.id = orders.product_id
       WHERE order_id = ?`,
      [orderId]
    );

    if (status === 'failed' && order && order.contact) {
      await notifyCustomer(order.contact, {
        subject: `Pembayaran Gagal — ${orderId}`,
        message: `Pembayaran untuk Order ${orderId} gagal/dibatalkan. Kalau ini keliru, silakan coba pesan ulang di website kami.`,
        html: `<p>Pembayaran untuk Order <b>${orderId}</b> gagal atau dibatalkan.</p><p>Kalau ini keliru, silakan coba pesan ulang di website kami.</p>`,
      });
    }

    if (status === 'paid' && order) {
      await fulfillPaidOrder(orderId);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send('Error processing notification');
  }
});

module.exports = router;
