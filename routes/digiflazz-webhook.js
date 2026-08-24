const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { notifyCustomer } = require('../utils/notify');

// POST /api/digiflazz-webhook - dipanggil otomatis oleh Digiflazz saat status
// transaksi topup berubah (sukses/gagal). Daftarkan URL ini di dashboard
// Digiflazz: Pengaturan Koneksi > API > Edit Koneksi API > Webhook > Payload URL
router.post('/', (req, res) => {
  const secret = process.env.DIGIFLAZZ_WEBHOOK_SECRET;
  const signatureHeader = req.headers['x-hub-signature']; // format: "sha1=xxxxx"

  if (secret) {
    if (!signatureHeader || !req.rawBody) {
      return res.status(403).send('Signature tidak ada');
    }

    const expected =
      'sha1=' + crypto.createHmac('sha1', secret).update(req.rawBody).digest('hex');

    if (signatureHeader !== expected) {
      console.error('[digiflazz-webhook] Signature tidak cocok, request ditolak.');
      return res.status(403).send('Signature tidak valid');
    }
  } else {
    console.warn('[digiflazz-webhook] DIGIFLAZZ_WEBHOOK_SECRET belum diset — signature TIDAK diverifikasi.');
  }

  const data = req.body && req.body.data;
  if (!data) {
    return res.status(400).send('Payload tidak lengkap');
  }

  const { ref_id, status, sn, message, rc } = data;

  console.log(`[digiflazz-webhook] Order ${ref_id}: status=${status} rc=${rc} sn=${sn || '-'}`);

  // ref_id yang kita kirim saat topup = order_id kita sendiri, jadi bisa langsung match
  const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(ref_id);

  if (!order) {
    console.warn(`[digiflazz-webhook] Order ${ref_id} tidak ditemukan di database kita.`);
    return res.status(200).send('OK'); // tetap 200 biar Digiflazz tidak retry terus
  }

  const deliveryStatus = status === 'Sukses' ? 'terkirim' : status === 'Gagal' ? 'gagal' : 'diproses';

  db.prepare(
    `UPDATE orders SET delivery_status = ?, delivery_sn = ?, delivery_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`
  ).run(deliveryStatus, sn || null, message || null, ref_id);

  if (deliveryStatus === 'terkirim' && order.contact) {
    notifyCustomer(order.contact, {
      subject: `⚡ Diamond Berhasil Masuk — ${ref_id}`,
      message: `*TOP UP BERHASIL!* ⚡💎\n\nDiamond sudah berhasil masuk langsung ke akun kamu:\n🎮 *Akun:* ${order.game_user_id}${order.game_zone_id ? ` (${order.game_zone_id})` : ''}\n🧾 *Order ID:* \`${ref_id}\`\n${sn ? `🔑 *No Seri (SN):* \`${sn}\`\n` : ''}\nTerima kasih telah top up di *JAGESTORE*! Selamat bermain! 🏆✨\n\n🌐 https://jagestore.shop/`,
      html: `<p>Top Up Berhasil!</p><p>Diamond untuk Order <b>${ref_id}</b> sudah masuk ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p>${sn ? `<p><b>No Seri (SN):</b> ${sn}</p>` : ''}<p>Selamat bermain!</p>`,
    }).catch(() => {});
  } else if (deliveryStatus === 'gagal' && order.contact) {
    notifyCustomer(order.contact, {
      subject: `⚠️ Pengiriman Diamond Tertunda — ${ref_id}`,
      message: `*PEMBERITAHUAN PENGIRIMAN* ⚠️\n\nPengiriman diamond untuk Order \`${ref_id}\` mengalami kendala sistem: _${message || 'Silakan hubungi CS'}_.\n\n🛡️ *Dana Anda 100% aman!* Hubungi CS untuk bantuan kilat: https://wa.me/6281295713923?text=Halo%20Admin%20Order%20${ref_id}%20butuh%20bantuan`,
      html: `<p>Pengiriman diamond untuk Order <b>${ref_id}</b> gagal diproses (${message || ''}).</p><p>Dana kamu aman. Tim kami sedang menindaklanjuti.</p>`,
    }).catch(() => {});
  }

  res.status(200).send('OK');
});

module.exports = router;
