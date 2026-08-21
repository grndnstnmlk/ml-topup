// Script uji coba API Cek ID / Nickname publik untuk Mobile Legends.
// Cara pakai: node scripts/test-velixs.js

const userId = '157228049';
const zoneId = '2241';

async function checkNickname() {
  console.log(`Mengecek ID: ${userId} (${zoneId})...`);
  const res = await fetch(`https://api.isan.eu.org/nickname/ml?id=${userId}&server=${zoneId}`);
  const data = await res.json().catch(() => null);
  console.log('HTTP status:', res.status);
  console.log('Hasil:', JSON.stringify(data, null, 2));
}

checkNickname().catch((err) => {
  console.error('Gagal menghubungi API Cek ID:', err.message);
});

