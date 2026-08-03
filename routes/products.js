const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products?game=mobile-legends - daftar paket untuk 1 game
// Hanya tampilkan produk yang sudah punya digiflazz_sku — produk tanpa SKU
// (biasanya sisa/yatim dari perubahan katalog sebelumnya, atau game baru yang
// belum diisi SKU asli) tidak akan pernah bisa dikirim otomatis, jadi jangan
// sampai muncul buat dipilih customer.
router.get('/', (req, res) => {
  const { game } = req.query;
  let sql = "SELECT * FROM products WHERE digiflazz_sku IS NOT NULL AND digiflazz_sku != ''";
  const params = [];

  if (game) {
    sql += ' AND game = ?';
    params.push(game);
  }
  sql += ' ORDER BY sort_order ASC';

  const products = db.prepare(sql).all(...params);
  res.json(products);
});

// GET /api/products/games - daftar game yang punya minimal 1 produk siap jual
// (dipakai frontend untuk tahu tab game mana yang perlu ditampilkan)
router.get('/games', (req, res) => {
  const rows = db
    .prepare(
      "SELECT DISTINCT game FROM products WHERE digiflazz_sku IS NOT NULL AND digiflazz_sku != ''"
    )
    .all();
  res.json(rows.map((r) => r.game));
});

module.exports = router;
