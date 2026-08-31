const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products?game=mobile-legends - daftar paket untuk 1 game
router.get('/', async (req, res) => {
  try {
    const { game } = req.query;
    let sql = "SELECT * FROM products WHERE digiflazz_sku IS NOT NULL AND digiflazz_sku != ''";
    const params = [];

    if (game) {
      sql += ' AND game = ?';
      params.push(game);
    }
    sql += ' ORDER BY sort_order ASC';

    const products = await db.all(sql, params);
    res.json(products);
  } catch (err) {
    console.error('Error get products:', err.message);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

// GET /api/products/games - daftar game yang punya minimal 1 produk siap jual
router.get('/games', async (req, res) => {
  try {
    const rows = await db.all("SELECT DISTINCT game FROM products WHERE digiflazz_sku IS NOT NULL AND digiflazz_sku != ''");
    res.json(rows.map((r) => r.game));
  } catch (err) {
    console.error('Error get games:', err.message);
    res.status(500).json({ error: 'Gagal mengambil daftar game' });
  }
});

module.exports = router;
