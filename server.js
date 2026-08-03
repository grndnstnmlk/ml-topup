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

// Auto-seed produk jika tabel masih kosong (memudahkan first run)
const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (count === 0) {
  console.log('Database kosong, menjalankan seed produk otomatis...');
  require('./db-seed');
}

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/digiflazz-webhook', digiflazzWebhookRouter);
app.use('/api/check-id', checkIdRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
