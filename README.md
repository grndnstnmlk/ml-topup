# JAGESTORE — Website Top Up Mobile Legends

Website top up diamond Mobile Legends: Bang Bang yang lengkap: frontend, backend,
database, dan integrasi payment gateway (Midtrans).

## Struktur Project

```
ml-topup/
├── server.js           # Entry point server Express
├── db.js                # Setup database SQLite
├── db-seed.js            # Data awal paket diamond
├── routes/
│   ├── products.js       # API daftar paket
│   ├── orders.js         # API buat & cek pesanan (+ Midtrans Snap)
│   └── webhook.js        # Terima notifikasi status bayar dari Midtrans
├── public/
│   ├── index.html         # Halaman utama / beli
│   ├── status.html        # Halaman cek status pesanan
│   ├── css/style.css
│   └── js/app.js
├── .env.example
└── package.json
```

## 1. Instalasi

Pastikan Node.js versi 18 ke atas sudah terpasang, lalu:

```bash
cd ml-topup
npm install
cp .env.example .env
```

## 2. Ambil Kredensial Midtrans (Payment Gateway)

Situs ini pakai **Midtrans Snap** untuk menerima pembayaran (QRIS, e-wallet,
transfer bank, kartu, dsb) — payment gateway paling umum dipakai untuk
top up game di Indonesia.

1. Daftar akun di https://dashboard.midtrans.com
2. Selama masih testing, pakai mode **Sandbox** (gratis, tanpa transaksi
   nyata). Ambil `Server Key` dan `Client Key` di menu
   **Settings → Access Keys**.
3. Isi ke file `.env`:
   ```
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
   MIDTRANS_IS_PRODUCTION=false
   ```
4. Buka `public/index.html`, cari tag `<script id="midtrans-script">`
   di bagian bawah, ganti `data-client-key` dengan Client Key kamu
   (harus sama dengan yang di `.env`).
5. Kalau sudah siap terima uang sungguhan: selesaikan verifikasi bisnis
   di Midtrans, ambil kredensial **Production**, ganti
   `MIDTRANS_IS_PRODUCTION=true`, dan ganti juga URL script Snap.js di
   `index.html` dari `app.sandbox.midtrans.com` menjadi `app.midtrans.com`.

## 3. Jalankan

```bash
npm run seed     # isi database dengan paket diamond (otomatis jalan juga saat start pertama)
npm start
```

Buka `http://localhost:3000`.

## 4. Supaya Notifikasi Pembayaran Masuk (PENTING)

Midtrans memberi tahu server kamu saat pembayaran berhasil lewat webhook
ke `/api/webhook/midtrans`. Supaya Midtrans bisa menjangkau server kamu:

- **Saat development:** pakai [ngrok](https://ngrok.com) untuk expose
  `localhost:3000` ke URL publik sementara:
  ```bash
  ngrok http 3000
  ```
- **Saat production:** deploy ke hosting (lihat bagian 6), lalu daftarkan
  URL webhook di dashboard Midtrans:
  **Settings → Configuration → Payment Notification URL**, isi dengan:
  ```
  https://domainkamu.com/api/webhook/midtrans
  ```

Tanpa langkah ini, status pesanan akan tetap "pending" walau pembeli
sudah membayar.

## 5. Pengiriman Diamond Otomatis (perlu kamu tambahkan)

Website ini sudah menangani pembayaran secara penuh, tapi **pengiriman
diamond ke akun Mobile Legends memerlukan API dari supplier/reseller
diamond** — ini di luar cakupan Midtrans, dan kredensialnya harus kamu
dapatkan sendiri dari penyedia resmi (bukan sesuatu yang bisa saya
buatkan tanpa akun asli kamu). Provider yang umum dipakai di Indonesia:

- [Digiflazz](https://digiflazz.com)
- [VIP Reseller](https://vip-reseller.co.id)
- Provider resmi H2H lain yang punya produk diamond ML

Setelah kamu punya akun & API key dari salah satu provider tersebut,
lengkapi bagian `TODO` di `routes/webhook.js` (dicari dengan
`Ctrl+F "TODO"`) untuk memanggil API mereka begitu status order
menjadi `paid`. Polanya kira-kira:

```js
if (status === 'paid') {
  await fetch('https://api-supplier.com/order', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.SUPPLIER_API_KEY}` },
    body: JSON.stringify({
      sku: product_sku_diamond_sesuai_provider,
      target: `${order.game_user_id}${order.game_zone_id}`,
    }),
  });
}
```

Sebelum ini terhubung, anggap saja order yang sudah `paid` masih perlu
dikirim manual — kamu bisa cek daftar order lunas langsung dari database
(`data.sqlite`, tabel `orders`) atau tambahkan halaman admin sederhana.

## 6. Deploy ke Hosting

Aplikasi ini adalah Node.js standar + SQLite (file lokal), jadi cocok
di-deploy ke platform seperti:

- **Railway** atau **Render** — paling mudah, tinggal hubungkan repo
  Git, set environment variables dari `.env`, deploy.
- **VPS (mis. jadi.cloud, DigitalOcean, dsb)** — jalankan lewat PM2:
  ```bash
  npm install -g pm2
  pm2 start server.js --name ml-topup
  ```

Catatan: karena database pakai SQLite (file `data.sqlite`), pastikan
hosting yang dipakai punya **persistent storage** (disk yang tidak
hilang saat redeploy). Kalau butuh skala lebih besar / multi-server,
ganti ke PostgreSQL/MySQL nantinya.

## 7. Mengubah Harga & Paket

Edit langsung di `db-seed.js`, lalu jalankan ulang `npm run seed`
(ini akan mengganti seluruh isi tabel `products`).

## Catatan Legal

Pastikan kamu terdaftar sebagai reseller resmi atau punya izin dari
penyedia diamond/Moonton sebelum menjual top up secara komersial.
Website ini adalah tools teknis, bukan nasihat hukum atau bisnis.
