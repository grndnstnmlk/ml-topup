# Konvensi Validasi & Integrasi Top Up Game

## 1. Validasi Akun Game (Nickname & Region Checker)
- Gunakan endpoint publik andal atau fallback otomatis:
  - **Mobile Legends**: `https://api.isan.eu.org/nickname/ml?id={user_id}&server={zone_id}`
  - **Free Fire**: `https://api.isan.eu.org/nickname/ff?id={user_id}`
- Sertakan informasi `username` dan `country` jika tersedia dari respons API.

## 2. Prinsip Non-Blocking pada Layanan Pihak Ketiga
- Selalu terapkan *AbortController* dengan timeout maksimal 6 detik pada pemanggilan API eksternal.
- Jika layanan checker pihak ketiga gagal, mengalami rate-limit, atau timeout, jangan pernah mengunci (*disable*) tombol pembelian. Kembalikan `{ valid: false, unavailable: true }` agar pembeli tetap dapat melakukan checkout.

## 3. Format Tampilan Akun di Frontend
- Jika berhasil diverifikasi, tampilkan dengan format:
  `✓ Nickname: <NAMA_AKUN> (<NEGARA/REGION>)`
- Pastikan input ID dan Server di-debounce saat mendengarkan perubahan (input/blur).
