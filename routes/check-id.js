const express = require('express');
const router = express.Router();

// POST /api/check-id - cek nickname akun ML/Game via layanan publik
router.post('/', async (req, res) => {
  const { game_user_id, game_zone_id, game = 'mobile-legends' } = req.body;

  if (!game_user_id) {
    return res.status(400).json({ valid: false, error: 'User ID wajib diisi' });
  }

  // Untuk Mobile Legends, zone ID wajib ada
  if (game === 'mobile-legends' && !game_zone_id) {
    return res.status(400).json({ valid: false, error: 'Zone ID wajib diisi untuk Mobile Legends' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6 detik timeout

    let url = '';
    if (game === 'mobile-legends') {
      url = `https://api.isan.eu.org/nickname/ml?id=${encodeURIComponent(game_user_id)}&server=${encodeURIComponent(game_zone_id)}`;
    } else if (game === 'free-fire') {
      url = `https://api.isan.eu.org/nickname/ff?id=${encodeURIComponent(game_user_id)}`;
    } else {
      // Game lain belum didukung cek nickname publik — lewati tanpa memblokir
      return res.json({ valid: false, unavailable: true });
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      // Jika status HTTP 4xx/5xx (misal ID tidak ditemukan atau service sedang gangguan)
      return res.json({ valid: false, message: 'ID tidak ditemukan' });
    }

    const data = await response.json();

    if (data && data.success && data.name) {
      return res.json({ valid: true, username: data.name });
    }

    return res.json({ valid: false, message: 'ID tidak ditemukan' });
  } catch (err) {
    console.error('[check-id] Gagal cek nickname:', err.message);
    // Jika koneksi timeout atau API publik sedang offline, jangan blokir alur checkout
    return res.json({ valid: false, unavailable: true });
  }
});

module.exports = router;
