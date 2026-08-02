# Panduan Git & GitHub — GREEND TOP UP

Catatan lengkap perintah terminal untuk upload/update project ini ke GitHub.

## Setup Pertama Kali (folder baru)

Kalau ini folder yang baru pertama kali disambungkan ke GitHub:

```
cd path\ke\folder\ml-topup
git remote add origin https://github.com/grndnstnmlk/ml-topup.git
git branch -M main
git push -u origin main
```

Kalau muncul error `rejected ... fetch first`, biasanya karena GitHub sudah
punya isi dari sebelumnya. Karena ini repo pribadi kamu sendiri, aman untuk
menimpa dengan versi lokal:

```
git push -u origin main --force
```

## Update Rutin (setiap kali ada perubahan file)

Urutan yang selalu sama, dari folder project:

```
git status
git add .
git commit -m "tulis pesan singkat perubahan apa"
git push
```

- `git status` → cek dulu file mana saja yang berubah (opsional tapi bagus buat kebiasaan)
- `git add .` → siapkan semua perubahan
- `git commit -m "..."` → simpan sebagai satu titik perubahan, dengan catatan
- `git push` → kirim ke GitHub

## Cek Remote Tersambung ke Mana

```
git remote -v
```

Kalau hasilnya kosong, berarti remote belum di-set — ulangi bagian "Setup
Pertama Kali" di atas.

## Troubleshooting Cepat

| Error | Penyebab | Solusi |
|---|---|---|
| `running scripts is disabled on this system` | PowerShell execution policy | Buka PowerShell as Administrator, jalankan: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `src refspec main does not match any` | Branch lokal masih bernama `master` | `git branch -M main` |
| `rejected ... fetch first` | Isi GitHub beda riwayat dari lokal | `git push -u origin main --force` (aman untuk repo pribadi) |
| `'git' is not recognized` | Git belum terpasang / belum restart terminal | Install dari git-scm.com, TUTUP dan BUKA ULANG terminal setelah install |

## Catatan Keamanan

Jangan pernah menjalankan `git add .` lalu commit file `.env` — file itu
sudah otomatis diabaikan lewat `.gitignore`, tapi selalu cek dengan
`git status` sebelum commit kalau ragu. File `.env` berisi kredensial
(Digiflazz, Midtrans, Velixs) yang tidak boleh terlihat publik di GitHub.
