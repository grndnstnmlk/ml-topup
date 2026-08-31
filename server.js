require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const rateLimit = require('express-rate-limit');

const db = require('./db');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const webhookRouter = require('./routes/webhook');
const digiflazzWebhookRouter = require('./routes/digiflazz-webhook');
const checkIdRouter = require('./routes/check-id');
const { router: adminRouter, requireAdminAuth } = require('./routes/admin');
const { deleteStalePendingOrders } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 3000;

// Percayai reverse proxy Railway / Cloudflare agar rate limiter membaca IP asli
app.set('trust proxy', 1);

app.use(cors());
// verify: simpan raw body mentah, dibutuhkan untuk cek signature webhook Digiflazz
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// --- RATE LIMITERS (Proteksi Anti-Spam / Anti-Abuse) ---
const checkIdLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 45, // maks 45 request per menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { valid: false, error: 'Terlalu banyak permintaan cek ID. Coba lagi dalam 1 menit.' },
});

const orderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 menit
  max: 25, // maks 25 order per 5 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak pembuatan pesanan. Coba lagi dalam beberapa saat.' },
});

// Auto-seed produk kalau tabel masih kosong, ATAU kalau FORCE_RESEED=true diset
(async () => {
  try {
    await db.init();
    const countRow = await db.get('SELECT COUNT(*) AS c FROM products');
    const count = countRow ? Number(countRow.c) : 0;
    if (count === 0) {
      console.log('Database kosong, menjalankan seed produk otomatis...');
      const { seed } = require('./db-seed');
      await seed();
    } else if (process.env.FORCE_RESEED === 'true') {
      console.log('FORCE_RESEED=true terdeteksi, menjalankan ulang seed produk...');
      const { seed } = require('./db-seed');
      await seed();
    }
  } catch (err) {
    console.error('Error saat inisialisasi / auto-seed database:', err.message);
  }
})();

// Endpoint konfigurasi publik untuk frontend (sinkron otomatis dengan .env)
app.get('/api/config', (req, res) => {
  res.json({
    midtrans_client_key: process.env.MIDTRANS_CLIENT_KEY || '',
    is_production: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    payment_method: process.env.PAYMENT_METHOD || 'midtrans',
  });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', orderLimiter, ordersRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/digiflazz-webhook', digiflazzWebhookRouter);
app.use('/api/check-id', checkIdLimiter, checkIdRouter);
app.use('/api/admin', adminRouter);

// Halaman admin.html digerbang lewat auth yang sama dengan /api/admin
app.get('/admin.html', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

// Hapus order 'pending' yang sudah lewat 3 hari (ditinggal pembeli) — jalan
// sekali saat startup, lalu diulang tiap 6 jam selama server hidup.
deleteStalePendingOrders();
setInterval(deleteStalePendingOrders, 6 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
