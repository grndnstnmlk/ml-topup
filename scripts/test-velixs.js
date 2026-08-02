// Script uji coba Velixs ID Game Checker API untuk Mobile Legends.
// Format request ini diambil langsung dari Lab API di dashboard Velixs.
// Cara pakai: node scripts/test-velixs.js

require('dotenv').config();

const apiKey = process.env.VELIXS_API_KEY;

if (!apiKey) {
  console.error('VELIXS_API_KEY belum diisi di file .env');
  process.exit(1);
}

// --- GANTI dengan User ID & Zone ID akun ML asli untuk testing ---
const userId = '157228049';
const zoneId = '2241';

async function checkNickname() {
  const res = await fetch('https://api.velixs.com/idgames-checker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game: 'ml',
      id: userId,
      zoneid: zoneId,
      apikey: apiKey,
    }),
  });

  const data = await res.json().catch(() => null);
  console.log('HTTP status:', res.status);
  console.log(JSON.stringify(data, null, 2));
}

checkNickname().catch((err) => {
  console.error('Gagal menghubungi Velixs:', err.message);
});
