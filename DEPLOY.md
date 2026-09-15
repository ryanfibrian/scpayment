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

## 3. Upload Kode Aplikasi

Pilih salah satu:

**A. Via Git (kalau cPanel punya "Git Version Control")**
- Push folder project ini ke repo Git (GitHub/GitLab), lalu di cPanel > Git
  Version Control, clone repo tersebut ke folder aplikasi (misal `~/scpayment`).

**B. Via File Manager**
- Zip seluruh folder project ini **kecuali** `node_modules/`, `.env`, `sessions/`.
- Upload lewat cPanel > File Manager ke folder aplikasi (misal `~/scpayment`,
  di luar `public_html` supaya kode tidak bisa diakses publik langsung).
- Extract zip di sana.

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
#    (file ini sudah hasil konversi dari Excel "Laporan pembayaran 21052026.xlsx"
#    dan sudah ikut ter-upload bersama kode)
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
