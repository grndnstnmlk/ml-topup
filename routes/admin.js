const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { topupDiamond } = require('../utils/digiflazz');
const { notifyCustomer } = require('../utils/notify');
const { fulfillPaidOrder } = require('../utils/fulfillment');

// Auth sederhana (HTTP Basic) khusus untuk dashboard admin.
// Wajib set ADMIN_USER & ADMIN_PASSWORD di .env / environment variables Railway.
function requireAdminAuth(req, res, next) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return res.status(500).send('ADMIN_USER / ADMIN_PASSWORD belum diset di environment variables.');
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Login diperlukan');
  }

  const [reqUser, reqPass] = Buffer.from(encoded, 'base64').toString().split(/:(.*)/s);

  const userBuf = Buffer.from(reqUser || '');
  const passBuf = Buffer.from(reqPass || '');
  const userExpected = Buffer.from(user);
  const passExpected = Buffer.from(pass);

  const userMatch =
    userBuf.length === userExpected.length && crypto.timingSafeEqual(userBuf, userExpected);
  const passMatch =
    passBuf.length === passExpected.length && crypto.timingSafeEqual(passBuf, passExpected);

  if (!userMatch || !passMatch) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Username atau password salah');
  }

  next();
}

router.use(requireAdminAuth);

// GET /api/admin/orders?status=paid&q=MLTOP-xxx - daftar order terbaru
router.get('/orders', (req, res) => {
  const { status, delivery_status, q } = req.query;
  let sql = `SELECT orders.*, products.name AS product_name, products.digiflazz_sku
             FROM orders JOIN products ON products.id = orders.product_id`;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('orders.status = ?');
    params.push(status);
  }
  if (delivery_status) {
    conditions.push('orders.delivery_status = ?');
    params.push(delivery_status);
  }
  if (q) {
    conditions.push('orders.order_id LIKE ?');
    params.push(`%${q}%`);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY orders.created_at DESC LIMIT 200';

  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

// POST /api/admin/orders/:order_id/retry - kirim ulang diamond secara manual
// (aturan keamanan sama seperti scripts/retry-delivery.js)
router.post('/orders/:order_id/retry', async (req, res) => {
  const orderId = req.params.order_id;

  const order = db
    .prepare(
      `SELECT orders.*, products.name AS product_name, products.digiflazz_sku
       FROM orders JOIN products ON products.id = orders.product_id
       WHERE order_id = ?`
    )
    .get(orderId);

  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });

  if (order.status !== 'paid') {
    return res.status(400).json({ error: `Order belum "paid" (status saat ini: ${order.status})` });
  }

  if (order.delivery_status === 'terkirim') {
    return res.status(400).json({
      error: 'Order ini sudah berstatus "terkirim" sebelumnya — retry dibatalkan untuk mencegah pengiriman ganda.',
    });
  }

  if (!order.digiflazz_sku) {
    return res.status(400).json({ error: 'Produk untuk order ini belum punya digiflazz_sku.' });
  }

  const customerNo = `${order.game_user_id}${order.game_zone_id}`;
  const result = await topupDiamond({ sku: order.digiflazz_sku, customerNo, refId: orderId });

  db.prepare(
    `UPDATE orders SET delivery_status = ?, delivery_sn = ?, delivery_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`
  ).run(result.status, result.sn || null, result.message || null, orderId);

  if (result.status === 'terkirim' && order.contact) {
    notifyCustomer(order.contact, {
      subject: `⚡ Diamond Berhasil Masuk — ${orderId}`,
      message: `*TOP UP BERHASIL!* ⚡💎\n\nDiamond sudah berhasil masuk langsung ke akun kamu:\n🎮 *Akun:* ${order.game_user_id}${order.game_zone_id ? ` (${order.game_zone_id})` : ''}\n🧾 *Order ID:* \`${orderId}\`\n${result.sn ? `🔑 *No Seri (SN):* \`${result.sn}\`\n` : ''}\nTerima kasih telah top up di *JAGESTORE*! Selamat bermain! 🏆✨\n\n🌐 https://jagestore.shop/`,
      html: `<p>Diamond untuk Order <b>${orderId}</b> sudah berhasil masuk ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p>${result.sn ? `<p><b>No Seri (SN):</b> ${result.sn}</p>` : ''}<p>Selamat bermain!</p>`,
    }).catch(() => {});
  }

  res.json({ order_id: orderId, status: result.status, message: result.message, sn: result.sn || null });
});

// POST /api/admin/orders/:order_id/mark-paid - konfirmasi manual (mis. bayar
// lewat QRIS statis punya sendiri selagi akun Midtrans belum di-acc), lalu
// langsung kirim diamond lewat alur yang sama dengan webhook Midtrans.
router.post('/orders/:order_id/mark-paid', async (req, res) => {
  const orderId = req.params.order_id;

  const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);

  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });

  if (order.status === 'paid') {
    return res.status(400).json({ error: 'Order ini sudah berstatus "paid" sebelumnya.' });
  }

  db.prepare(
    `UPDATE orders SET status = 'paid', payment_type = COALESCE(payment_type, 'qris-manual'), updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`
  ).run(orderId);

  await fulfillPaidOrder(orderId);

  res.json({ ok: true });
});

// POST /api/admin/orders/:order_id/mark-delivered - konfirmasi pengiriman manual + input SN resmi
router.post('/orders/:order_id/mark-delivered', async (req, res) => {
  const orderId = req.params.order_id;
  const { sn, note } = req.body;

  const order = db
    .prepare(
      `SELECT orders.*, products.name AS product_name
       FROM orders JOIN products ON products.id = orders.product_id
       WHERE order_id = ?`
    )
    .get(orderId);

  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });

  const finalSn = (sn && sn.trim()) ? sn.trim() : `MANUAL-${Date.now()}`;
  const finalMsg = (note && note.trim()) ? note.trim() : 'Pesanan berhasil dikirim manual oleh Admin';

  db.prepare(
    `UPDATE orders 
     SET status = 'paid', 
         delivery_status = 'terkirim', 
         delivery_sn = ?, 
         delivery_message = ?, 
         updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`
  ).run(finalSn, finalMsg, orderId);

  if (order.contact) {
    notifyCustomer(order.contact, {
      subject: `⚡ Diamond Berhasil Masuk — ${orderId}`,
      message: `*TOP UP BERHASIL!* ⚡💎\n\nDiamond sudah berhasil masuk langsung ke akun kamu:\n🎮 *Akun:* ${order.game_user_id}${order.game_zone_id ? ` (${order.game_zone_id})` : ''}\n📦 *Item:* ${order.product_name}\n🧾 *Order ID:* \`${orderId}\`\n🔑 *No Seri (SN):* \`${finalSn}\`\n\nTerima kasih telah top up di *JAGESTORE*! Selamat bermain! 🏆✨\n\n🌐 https://jagestore.shop/`,
      html: `<p>Top Up Berhasil!</p><p>Diamond untuk Order <b>${orderId}</b> (${order.product_name}) sudah masuk ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p><p><b>No Seri (SN):</b> ${finalSn}</p><p>Selamat bermain!</p>`,
    }).catch((e) => console.error('[admin:mark-delivered] Gagal kirim notifikasi:', e.message));
  }

  res.json({ ok: true, order_id: orderId, delivery_status: 'terkirim', sn: finalSn });
});

// POST /api/admin/orders/:order_id/update-status - ubah status order secara menyeluruh
router.post('/orders/:order_id/update-status', (req, res) => {
  const orderId = req.params.order_id;
  const { status, delivery_status, delivery_sn, delivery_message } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });

  const newStatus = status || order.status;
  const newDeliveryStatus = delivery_status || order.delivery_status;
  const newSn = delivery_sn !== undefined ? delivery_sn : order.delivery_sn;
  const newMsg = delivery_message !== undefined ? delivery_message : order.delivery_message;

  db.prepare(
    `UPDATE orders 
     SET status = ?, delivery_status = ?, delivery_sn = ?, delivery_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`
  ).run(newStatus, newDeliveryStatus, newSn, newMsg, orderId);

  res.json({ ok: true, order_id: orderId });
});

module.exports = { router, requireAdminAuth };
