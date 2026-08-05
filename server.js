require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Auto-seed produk kalau tabel masih kosong, ATAU kalau FORCE_RESEED=true diset
// (dipakai kalau katalog produk di db-seed.js berubah — harga baru, SKU baru, dsb).
// Seed sekarang bersifat UPSERT (update kalau SKU sudah ada, insert kalau baru),
// TIDAK menghapus produk lama — jadi aman dijalankan berkali-kali walau sudah
// ada order asli yang mereferensikan product_id lama.
const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (count === 0) {
  console.log('Database kosong, menjalankan seed produk otomatis...');
  require('./db-seed');
} else if (process.env.FORCE_RESEED === 'true') {
  console.log('FORCE_RESEED=true terdeteksi, menjalankan ulang seed produk...');
  require('./db-seed');
}

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/digiflazz-webhook', digiflazzWebhookRouter);
app.use('/api/check-id', checkIdRouter);
app.use('/api/admin', adminRouter);

// Halaman admin.html digerbang lewat auth yang sama dengan /api/admin
// (didaftarkan sebelum express.static supaya tidak ke-serve tanpa login)
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
