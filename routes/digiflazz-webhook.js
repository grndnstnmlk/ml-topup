const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { notifyCustomer } = require('../utils/notify');

router.post('/', async (req, res) => {
  const secret = process.env.DIGIFLAZZ_WEBHOOK_SECRET;
  const signatureHeader = req.headers['x-hub-signature'];
  const eventHeader = req.headers['x-digiflazz-event'];

  if (secret) {
    if (!signatureHeader || !req.rawBody) {
      console.warn('[digiflazz-webhook] Ditolak: Signature header atau rawBody tidak ditemukan.');
      return res.status(403).send('Signature tidak ada');
    }

    const hash = crypto.createHmac('sha1', secret).update(req.rawBody).digest('hex');
    const validWithPrefix = `sha1=${hash}`;
    const validWithoutPrefix = hash;

    if (signatureHeader !== validWithPrefix && signatureHeader !== validWithoutPrefix) {
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

  const baseOrderId = ref_id ? ref_id.replace(/-R\d+$/, '') : ref_id;
  const order = await db.get('SELECT * FROM orders WHERE order_id = ? OR order_id = ?', [ref_id, baseOrderId]);

  if (!order) {
    console.warn(`[digiflazz-webhook] Order ${ref_id} (base: ${baseOrderId}) tidak ditemukan di database.`);
    return res.status(200).send('OK');
  }

  const deliveryStatus = status === 'Sukses' ? 'terkirim' : status === 'Gagal' ? 'gagal' : 'diproses';

  await db.run(
    `UPDATE orders SET delivery_status = ?, delivery_sn = ?, delivery_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`,
    [deliveryStatus, sn || null, message || null, order.order_id]
  );

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
