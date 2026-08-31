const crypto = require('crypto');

// DIGIFLAZZ_MODE=production baru dipakai kalau akun Digiflazz kamu sudah
// benar-benar diaktifkan ke mode Production di dashboard mereka.
// Selama masih 'development' (default), pakai Development Key + testing:true
// supaya TIDAK memotong saldo asli / TIDAK mengirim diamond sungguhan.
function getCredentials() {
  const isProduction = process.env.DIGIFLAZZ_MODE === 'production';
  const apiKey = isProduction
    ? (process.env.DIGIFLAZZ_PROD_KEY || process.env.DIGIFLAZZ_API_KEY || process.env.DIGIFLAZZ_DEV_KEY)
    : (process.env.DIGIFLAZZ_DEV_KEY || process.env.DIGIFLAZZ_API_KEY || process.env.DIGIFLAZZ_PROD_KEY);

  return {
    username: process.env.DIGIFLAZZ_USERNAME,
    apiKey,
    testing: !isProduction,
  };
}

async function topupDiamond({ sku, customerNo, refId }) {
  const { username, apiKey, testing } = getCredentials();

  if (!username || !apiKey) {
    return { ok: false, status: 'gagal', message: 'Kredensial Digiflazz belum diisi di environment variables' };
  }

  const sign = crypto.createHash('md5').update(username + apiKey + refId).digest('hex');

  const payload = {
    username,
    buyer_sku_code: sku,
    customer_no: customerNo,
    ref_id: refId,
    sign,
  };

  if (testing) {
    payload.testing = true;
  }

  try {
    const res = await fetch('https://api.digiflazz.com/v1/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!json) {
      return { ok: false, status: 'gagal', message: `Server Digiflazz HTTP ${res.status}` };
    }

    const data = json.data;
    if (!data) {
      const errMsg = json.message || JSON.stringify(json);
      return { ok: false, status: 'gagal', message: `Digiflazz error: ${errMsg}` };
    }

    // status Digiflazz: "Sukses" | "Gagal" | "Pending"
    let status = 'diproses';
    if (data.status === 'Sukses') status = 'terkirim';
    else if (data.status === 'Gagal') status = 'gagal';

    const message = data.message ? `${data.message}${data.rc ? ` [RC ${data.rc}]` : ''}` : data.status;

    return {
      ok: true,
      status,
      sn: data.sn || null,
      message,
      raw: data,
    };
  } catch (err) {
    return { ok: false, status: 'gagal', message: `Gagal menghubungi Digiflazz: ${err.message}` };
  }
}

module.exports = { topupDiamond };
