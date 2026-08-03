const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const { nanoid } = require('nanoid');
const db = require('../db');

// Game yang butuh Zone/Server ID selain User ID (mis. Mobile Legends).
// Game lain (Free Fire, PUBG Mobile, dst) cukup 1 ID saja.
const GAMES_REQUIRING_ZONE = ['mobile-legends'];

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// POST /api/orders - buat order baru + ambil Snap token dari Midtrans
router.post('/', async (req, res) => {
  try {
    const { product_id, game_user_id, game_zone_id, contact } = req.body;

    if (!product_id || !game_user_id || !contact) {
      return res.status(400).json({
        error: 'product_id, game_user_id, dan email wajib diisi',
      });
    }

    if (!contact.includes('@')) {
      return res.status(400).json({ error: 'Format email tidak valid' });
    }

    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(product_id);

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    if (GAMES_REQUIRING_ZONE.includes(product.game) && !game_zone_id) {
      return res.status(400).json({ error: 'Zone ID wajib diisi untuk game ini.' });
    }

    if (!product.digiflazz_sku) {
      console.warn(`[orders] Ditolak: produk id=${product.id} (${product.name}) belum punya digiflazz_sku.`);
      return res.status(400).json({
        error: 'Produk ini sedang tidak tersedia untuk sementara. Silakan pilih paket lain.',
      });
    }

    const orderId = `MLTOP-${Date.now()}-${nanoid(6).toUpperCase()}`;

    db.prepare(
      `INSERT INTO orders (order_id, product_id, game_user_id, game_zone_id, contact, price, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).run(orderId, product.id, game_user_id, game_zone_id || '', contact || null, product.price);

    // Buat transaksi Midtrans Snap
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: product.price,
      },
      item_details: [
        {
          id: `product-${product.id}`,
          price: product.price,
          quantity: 1,
          name: product.name.substring(0, 50),
        },
      ],
      customer_details: {
        first_name: `ID ${game_user_id}`,
        email: contact || 'noemail@example.com',
      },
      callbacks: {
        finish: `${process.env.APP_BASE_URL}/status.html?order_id=${orderId}`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    res.json({
      order_id: orderId,
      snap_token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (err) {
    console.error('Gagal membuat order:', err.message);
    res.status(500).json({ error: 'Gagal membuat transaksi. Coba lagi.' });
  }
});

// GET /api/orders/:order_id - cek status order
router.get('/:order_id', (req, res) => {
  const order = db
    .prepare(
      `SELECT orders.*, products.name AS product_name, products.diamonds, products.bonus
       FROM orders JOIN products ON products.id = orders.product_id
       WHERE order_id = ?`
    )
    .get(req.params.order_id);

  if (!order) return res.status(404).json({ error: 'Order tidak ditemukan' });
  res.json(order);
});

module.exports = router;
