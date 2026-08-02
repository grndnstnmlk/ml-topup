const express = require('express');
const router = express.Router();

// POST /api/check-id - cek nickname akun ML berdasarkan User ID + Zone ID.
// API key Velixs disimpan di server (.env), tidak pernah dikirim ke browser.
router.post('/', async (req, res) => {
  const { game_user_id, game_zone_id } = req.body;

  if (!game_user_id || !game_zone_id) {
    return res.status(400).json({ valid: false, error: 'User ID dan Zone ID wajib diisi' });
  }

  const apiKey = process.env.VELIXS_API_KEY;
  if (!apiKey) {
    // Fitur belum dikonfigurasi di server ini — jangan blokir alur beli,
    // cukup bilang fitur cek nickname tidak tersedia.
    return res.json({ valid: false, unavailable: true });
  }

  try {
    const response = await fetch('https://api.velixs.com/idgames-checker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: 'ml',
        id: game_user_id,
        zoneid: game_zone_id,
        apikey: apiKey,
      }),
    });

    const data = await response.json();

    if (data.status && data.data && data.data.username) {
      return res.json({ valid: true, username: data.data.username });
    }

    return res.json({ valid: false });
  } catch (err) {
    console.error('Gagal cek nickname via Velixs:', err.message);
    // Kalau API cek nickname sedang bermasalah, jangan halangi orang checkout.
    return res.json({ valid: false, unavailable: true });
  }
});

module.exports = router;
