# Panduan Deploy ke cPanel (scpayment.vicmic.id)

Aplikasi ini adalah Node.js + Express + MySQL. Panduan di bawah untuk deploy
sebagai subdomain baru `scpayment.vicmic.id` yang nempel di hosting cPanel
`vicmic.id` yang sudah ada, memakai fitur **Setup Node.js App**.

> Kalau paket hosting vicmic.id ternyata **tidak** punya menu "Setup Node.js App"
> di cPanel, kabari saya — berarti perlu pendekatan lain (PHP, atau upgrade paket
> hosting yang support Node.js).

---

## 1. Buat Subdomain

1. Login ke cPanel `vicmic.id`.
2. Buka **Domains** (atau **Subdomains** di cPanel versi lama).
3. Buat subdomain: `scpayment` domain `vicmic.id` → jadi `scpayment.vicmic.id`.
4. Document root bisa dibiarkan default (misal `scpayment.vicmic.id` atau
   `public_html/scpayment`) — nanti akan diarahkan otomatis oleh Setup Node.js App.

## 2. Buat Database MySQL

1. Buka cPanel > **MySQL® Databases**.
2. Buat database baru, misal `vicmic_scpayment`.
3. Buat user MySQL baru, misal `vicmic_scpayment_user`, dengan password kuat.
4. Tambahkan user tersebut ke database dengan hak akses **ALL PRIVILEGES**.
5. Catat: nama database lengkap, username lengkap (biasanya ada prefix akun
   cPanel, misal `namacpanel_vicmic_scpayment`), dan passwordnya.

## 3. Upload Kode Aplikasi (via File Manager)

> Catatan: cPanel "Git Version Control" menolak clone URL yang mengandung
> token/password tertanam (keamanan bawaan cPanel), dan repo GitHub-nya
> private — jadi cara paling praktis di sini adalah upload manual lewat File
> Manager, bukan lewat Git.

1. Di komputer lokal, buat file zip dari folder project ini, **kecuali**:
   `node_modules/`, `.env`, `sessions/`, `.git/`.
   - Cara cepat lewat PowerShell (dari dalam folder project):
     ```powershell
     Compress-Archive -Path .env.example,.gitignore,DEPLOY.md,README.md,config,data,middleware,package.json,package-lock.json,public,routes,scripts,server.js,sql -DestinationPath scpayment-deploy.zip
     ```
   - Atau pilih semua file/folder di File Explorer (kecuali `node_modules`,
     `.env`, `.git`) → klik kanan → **Send to > Compressed (zipped) folder**.
2. Login cPanel `vicmic.id` > **File Manager**.
3. Masuk/buat folder aplikasi di luar `public_html`, misal `/home/vicmicid/scpayment`
   (supaya kode tidak bisa diakses publik langsung).
4. Klik **Upload**, upload file zip tadi ke folder tersebut.
5. Setelah selesai upload, klik kanan file zip nya > **Extract**, lalu hapus
   file zip-nya kalau sudah tidak perlu.
6. Di dalam folder `scpayment/data/`, upload juga `transactions-seed.json`
   dari laptop kamu (file ini memang sengaja tidak ada di repo GitHub karena
   berisi data bisnis asli — nama barang, harga, no invoice).

Kalau nanti ada update kode, ulangi saja langkah 1–5 untuk file yang berubah
(atau re-upload semua & extract, timpa yang lama — data di database tidak
akan hilang karena terpisah dari file kode).

## 4. Setup Node.js App

1. Buka cPanel > **Setup Node.js App** > **Create Application**.
2. Isi:
   - **Node.js version**: pilih versi LTS terbaru yang tersedia (minimal 16, disarankan 18/20).
   - **Application mode**: `Production`.
   - **Application root**: folder tempat kode di-upload (misal `scpayment`).
   - **Application URL**: pilih subdomain `scpayment.vicmic.id`.
   - **Application startup file**: `server.js`.
3. Klik **Create**.
4. Setelah dibuat, buka halaman detail aplikasi tersebut. Di bagian
   **Environment Variables**, tambahkan satu per satu:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=namacpanel_vicmic_scpayment
   DB_USER=namacpanel_vicmic_scpayment_user
   DB_PASSWORD=password_yang_dibuat_di_langkah_2
   SESSION_SECRET=string_acak_panjang_bebas_min_32_karakter
   NODE_ENV=production
   ```
   (Tidak perlu isi `PORT` manual — cPanel/Passenger yang mengatur otomatis.)
5. Klik **Save**, lalu klik **Run NPM Install** (tombol ini menjalankan
   `npm install` sesuai `package.json`, hanya 6 dependency, ringan & cepat).

## 5. Buat Tabel & Import Data

Buka **Terminal** di cPanel (atau SSH kalau tersedia). Di halaman Setup Node.js
App tadi ada tombol/perintah untuk masuk ke *virtual environment* aplikasi
(contoh perintahnya biasanya ditampilkan di halaman itu, kira-kira seperti):

```bash
source /home/namacpanel/nodevenv/scpayment/18/bin/activate && cd /home/namacpanel/scpayment
```

Setelah masuk ke virtual environment & folder aplikasi, jalankan:

```bash
# 1. Buat tabel users & transactions
npm run migrate:schema

# 2. Import 488 baris data transaksi dari data/transactions-seed.json
#    (pastikan file ini sudah diupload manual ke folder data/ - lihat catatan
#    di Langkah 3, file ini TIDAK ada di repo GitHub)
npm run migrate:data

# 3. Buat akun admin — GANTI username & password di bawah ini!
node scripts/create-admin.js admin PasswordKuatAnda123!
```

Kalau cPanel-nya **tidak punya Terminal/SSH sama sekali**, langkah ini tidak
bisa dijalankan lewat UI biasa — perlu minta akses Terminal diaktifkan ke
support hosting, karena proses import data & hash password butuh eksekusi
Node.js langsung (bukan sekadar import SQL).

## 6. Restart & Cek

1. Kembali ke halaman **Setup Node.js App**, klik **Restart**.
2. Buka `https://scpayment.vicmic.id` di browser.
3. Login dengan username & password admin yang dibuat di langkah 5.
4. cPanel biasanya otomatis menyediakan SSL gratis (AutoSSL) untuk subdomain
   baru dalam beberapa menit–jam. Kalau belum aktif, cek cPanel > SSL/TLS Status.

---

## Kalau nanti mau update data lagi dari Excel

1. Jalankan lagi (di komputer lokal, bukan di server) untuk generate ulang
   `data/transactions-seed.json` dari file Excel terbaru:
   ```bash
   npm install xlsx --no-save
   node scripts/convert-excel-to-json.js "C:\path\ke\file-excel-baru.xlsx"
   npm uninstall xlsx
   ```
2. Upload ulang file `data/transactions-seed.json` ke server (timpa yang lama).
3. Di server: `node scripts/migrate-data.js --force` (menambahkan sebagai baris
   baru, tidak menghapus data lama — hapus manual dulu lewat phpMyAdmin kalau
   mau reset total).

## Reset password admin

```bash
node scripts/create-admin.js admin PasswordBaru123!
```
