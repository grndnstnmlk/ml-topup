// Script uji coba Velixs ID Game Checker API untuk Mobile Legends.
// Cara pakai: node scripts/test-velixs.js
// API Key dibaca dari .env (VELIXS_API_KEY)

require('dotenv').config();

const apiKey = process.env.VELIXS_API_KEY;

if (!apiKey) {
  console.error('VELIXS_API_KEY belum diisi di file .env');
  process.exit(1);
}

// --- GANTI dengan User ID & Zone ID akun ML asli untuk testing ---
const userId = '123456789';
const zoneId = '1234';

// Beberapa kemungkinan format yang umum dipakai API sejenis ini.
// Kita coba satu-satu, lihat mana yang balikannya sukses (bukan error "game not found").
const gameNameCandidates = ['mobile-legends', 'ml', 'mobilelegends', 'mobile_legends'];
const idFormatCandidates = [
  { label: 'id gabung "userid zoneid"', id: `${userId} ${zoneId}` },
  { label: 'id gabung "userid(zoneid)"', id: `${userId}(${zoneId})` },
  { label: 'id hanya userid (tanpa zone)', id: userId },
];

async function tryRequest(game, idVariant) {
  const url = `https://api.velixs.com/random-games?apikey=${encodeURIComponent(apiKey)}&game=${encodeURIComponent(game)}&id=${encodeURIComponent(idVariant.id)}`;

  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    console.log(`\n--- game="${game}" | ${idVariant.label} ---`);
    console.log('HTTP status:', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`\n--- game="${game}" | ${idVariant.label} ---`);
    console.log('Gagal fetch:', err.message);
  }
}

(async () => {
  console.log('Mencoba beberapa kombinasi nama game & format ID ke Velixs...\n');
  for (const game of gameNameCandidates) {
    for (const idVariant of idFormatCandidates) {
      await tryRequest(game, idVariant);
    }
  }
  console.log('\nSelesai. Cari kombinasi yang responsnya berisi nickname (bukan error), lalu kabari saya hasilnya.');
})();
