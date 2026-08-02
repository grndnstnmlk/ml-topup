const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products - daftar semua paket diamond
router.get('/', (req, res) => {
  const products = db
    .prepare('SELECT * FROM products ORDER BY sort_order ASC')
    .all();
  res.json(products);
});

module.exports = router;
