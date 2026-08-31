# JAGESTORE (ml-topup) — Agent Guidelines & Conventions

## 1. Arsitektur & Teknologi
- **Backend:** Node.js, Express.js, SQLite via `better-sqlite3` (WAL mode).
- **Frontend:** Vanilla HTML5, CSS3 kustom (tanpa Tailwind), Vanilla JS (`app.js`, `admin.js`).
- **Payment:** `qris_manual` (QRIS Statis + Admin verification) & Midtrans Snap.
- **Supplier:** Digiflazz API (Otomatis) + Admin Manual Fulfillment (Input SN).
- **Notifikasi:** Resend Email API (`utils/notify.js`).

---

## 2. Aturan Alur Pemesanan (Checkout Rules)
1. **Validasi Kontak (Email):**
   - Kontak pemesanan wajib berupa email dengan format standar yang valid (`nama@domain.com`).
2. **Pengecekan ID Game Non-Blocking:**
   - Cek ID akun via `api.isan.eu.org` bersifat memperkaya (*enrichment*) tampilan kartu pemain.
   - Jika layanan pihak ketiga offline, timeout, atau rate-limit, endpoint `/api/check-id` **HARUS** mengembalikan `{ valid: false, unavailable: true }`.
   - Tombol **"Pesan Sekarang"** tidak boleh dikunci (*disabled*) karena kegagalan API pihak ketiga.
3. **Database Consistency:**
   - Order dibuat dengan status `pending` dan `delivery_status: 'belum_diproses'`.

---

## 3. Aturan Pemrosesan Pesanan (Fulfillment & Admin)
1. **Otomatisasi Digiflazz:**
   - Jika `DIGIFLAZZ_USERNAME` dan API Key aktif, saat status pembayaran menjadi `paid`, `fulfillPaidOrder` akan otomatis menembak API Digiflazz.
2. **Pemrosesan Manual (Admin):**
   - Admin dapat menandai pesanan terkirim manual via endpoint `/api/admin/orders/:order_id/mark-delivered` dengan menyertakan nomor Seri Resmi (SN).
   - Setiap kali order ditandai `terkirim` (baik via Digiflazz webhook maupun manual SN), email bukti top up beserta SN wajib dikirim ke pembeli.
3. **Keamanan Admin:**
   - Akses `/admin.html` dan `/api/admin/*` dilindungi HTTP Basic Auth menggunakan `ADMIN_USER` & `ADMIN_PASSWORD`.

---

## 4. Standar UI/UX & Tampilan
- **Tema:** Dark gaming aesthetic (palette neon cyan `#00e5ff`, deep navy `#060814`, glassmorphism, gradient accents).
- **Feedback Visual:** Kartu holografik akun terverifikasi, animasi diamond sparkle, status pill jelas (Pending, Paid, Terkirim, Gagal).
- **Responsif:** Mobile-first, sticky sidebar ringkasan di desktop, kartu order rapi di mobile view admin.

---

## 5. Pengujian & Keamanan
- Gunakan Puppeteer / Node test runner untuk pengujian otomatis jika diperlukan. (Playwright dilarang/dihapus).
- Jangan pernah hardcode secret keys di frontend atau file repositori publik.
