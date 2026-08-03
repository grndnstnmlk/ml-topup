const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products - daftar semua paket diamond
// Hanya tampilkan produk yang sudah punya digiflazz_sku — produk tanpa SKU
// (biasanya sisa/yatim dari perubahan katalog sebelumnya) tidak akan pernah
// bisa dikirim otomatis, jadi jangan sampai muncul buat dipilih customer.
router.get('/', (req, res) => {
  const products = db
    .prepare(
      "SELECT * FROM products WHERE digiflazz_sku IS NOT NULL AND digiflazz_sku != '' ORDER BY sort_order ASC"
    )
    .all();
  res.json(products);
});

module.exports = router;
