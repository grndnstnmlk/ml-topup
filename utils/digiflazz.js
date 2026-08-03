const crypto = require('crypto');

// DIGIFLAZZ_MODE=production baru dipakai kalau akun Digiflazz kamu sudah
// benar-benar diaktifkan ke mode Production di dashboard mereka.
// Selama masih 'development' (default), pakai Development Key + testing:true
// supaya TIDAK memotong saldo asli / TIDAK mengirim diamond sungguhan.
function getCredentials() {
  const isProduction = process.env.DIGIFLAZZ_MODE === 'production';
  const apiKey = isProduction
    ? process.env.DIGIFLAZZ_PROD_KEY
    : process.env.DIGIFLAZZ_DEV_KEY;

  return {
    username: process.env.DIGIFLAZZ_USERNAME,
    apiKey,
    testing: !isProduction,
  };
}

async function topupDiamond({ sku, customerNo, refId }) {
  const { username, apiKey, testing } = getCredentials();

  if (!username || !apiKey) {
    return { ok: false, status: 'gagal', message: 'Kredensial Digiflazz belum diisi di .env' };
  }

  const sign = crypto.createHash('md5').update(username + apiKey + refId).digest('hex');

  try {
    const res = await fetch('https://api.digiflazz.com/v1/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        buyer_sku_code: sku,
        customer_no: customerNo,
        ref_id: refId,
        testing,
        sign,
      }),
    });

    const json = await res.json();
    const data = json.data;

    if (!data) {
      return { ok: false, status: 'gagal', message: 'Respons tidak terduga dari Digiflazz' };
    }

    // status Digiflazz: "Sukses" | "Gagal" | "Pending"
    let status = 'diproses';
    if (data.status === 'Sukses') status = 'terkirim';
    else if (data.status === 'Gagal') status = 'gagal';

    return {
      ok: true,
      status,
      sn: data.sn || null,
      message: data.message || data.status,
      raw: data,
    };
  } catch (err) {
    return { ok: false, status: 'gagal', message: `Gagal menghubungi Digiflazz: ${err.message}` };
  }
}

module.exports = { topupDiamond };
