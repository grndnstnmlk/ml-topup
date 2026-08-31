const db = require('../db');
const { topupDiamond } = require('./digiflazz');
const { notifyCustomer } = require('./notify');

async function fulfillPaidOrder(orderId) {
  const order = await db.get(
    `SELECT orders.*, products.name AS product_name, products.digiflazz_sku
     FROM orders JOIN products ON products.id = orders.product_id
     WHERE order_id = ?`,
    [orderId]
  );

  if (!order) return null;

  const statusUrl = `${process.env.APP_BASE_URL || 'https://jagestore.shop'}/status.html?order_id=${orderId}`;
  const formattedPrice = 'Rp' + Number(order.price).toLocaleString('id-ID');

  if (order.contact) {
    await notifyCustomer(order.contact, {
      subject: `✅ Pembayaran Berhasil — ${orderId}`,
      message: `*PEMBAYARAN DITERIMA* ✅\n\nHalo Gamers! Pembayaran kamu sudah berhasil diverifikasi:\n🧾 *Order ID:* \`${orderId}\`\n📦 *Paket:* ${order.product_name}\n🎮 *Akun:* ${order.game_user_id}${order.game_zone_id ? ` (${order.game_zone_id})` : ''}\n💰 *Nominal:* ${formattedPrice}\n\n⏳ _Sistem kami sedang otomatis mengirimkan diamond ke akunmu..._\n🔗 *Pantau Live:* ${statusUrl}`,
      html: `<p>Halo,</p><p>Pembayaran kamu untuk <b>${order.product_name}</b> (Order <b>${orderId}</b>) sudah berhasil!</p><p>Diamond sedang diproses ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p><p><a href="${statusUrl}">Pantau Status Pengiriman</a></p>`,
    });
  }

  if (!order.digiflazz_sku) {
    console.warn(`[digiflazz] Order ${orderId}: produk belum punya digiflazz_sku, lewati pengiriman otomatis.`);
    return order;
  }

  const customerNo = `${order.game_user_id}${order.game_zone_id}`;

  const result = await topupDiamond({
    sku: order.digiflazz_sku,
    customerNo,
    refId: orderId,
  });

  await db.run(
    `UPDATE orders SET delivery_status = ?, delivery_sn = ?, delivery_message = ?, updated_at = CURRENT_TIMESTAMP
     WHERE order_id = ?`,
    [result.status, result.sn || null, result.message || null, orderId]
  );

  console.log(`[digiflazz] Order ${orderId}: ${result.status} — ${result.message}`);

  if (result.status === 'terkirim' && order.contact) {
    await notifyCustomer(order.contact, {
      subject: `⚡ Diamond Berhasil Masuk — ${orderId}`,
      message: `*TOP UP BERHASIL!* ⚡💎\n\nDiamond sudah berhasil masuk langsung ke akun kamu:\n🎮 *Akun:* ${order.game_user_id}${order.game_zone_id ? ` (${order.game_zone_id})` : ''}\n📦 *Item:* ${order.product_name}\n🧾 *Order ID:* \`${orderId}\`\n${result.sn ? `🔑 *No Seri (SN):* \`${result.sn}\`\n` : ''}\nTerima kasih telah top up di *JAGESTORE*! Selamat bermain & push rank! 🏆✨\n\n🌐 https://jagestore.shop/`,
      html: `<p>Top Up Berhasil!</p><p>Diamond untuk Order <b>${orderId}</b> sudah masuk ke akun <b>${order.game_user_id} (${order.game_zone_id})</b>.</p>${result.sn ? `<p><b>No Seri (SN):</b> ${result.sn}</p>` : ''}<p>Selamat bermain!</p>`,
    });
  } else if (result.status === 'gagal' && order.contact) {
    await notifyCustomer(order.contact, {
      subject: `⚠️ Pengiriman Diamond Tertunda — ${orderId}`,
      message: `*PEMBERITAHUAN PENGIRIMAN* ⚠️\n\nPengiriman diamond untuk Order \`${orderId}\` mengalami kendala sistem: _${result.message}_.\n\n🛡️ *Tenang, dana Anda 100% aman!* Tim CS Admin kami sedang menindaklanjuti.\n\n💬 Hubungi CS jika butuh bantuan cepat: https://wa.me/6281295713923?text=Halo%20Admin%20Order%20${orderId}%20butuh%20bantuan`,
      html: `<p>Pengiriman diamond untuk Order <b>${orderId}</b> mengalami kendala (${result.message}).</p><p>Dana kamu aman. Tim kami sedang menindaklanjuti.</p>`,
    });
  }

  return order;
}

module.exports = { fulfillPaidOrder };
