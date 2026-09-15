# SC Payment - Vicmic

Aplikasi internal untuk melacak status pembayaran transaksi (sudah bayar /
belum bayar), migrasi dari data Excel "Laporan pembayaran". Deploy di
`scpayment.vicmic.id`.

Stack: **PHP + MySQL** (tanpa Node.js, tanpa build step) — session login
native PHP (single admin account), frontend vanilla HTML/CSS/JS. Dipilih
supaya deploy-nya sesimpel upload file ke cPanel, tanpa perlu "Setup Node.js
App" / npm install / Passenger.

## Fitur

- Login admin (username & password, PHP session).
- Tabel transaksi: No Invoice, Nama Barang, Harga Beli, Faktur Jual, Harga Jual, Catatan.
- Centang status **Sudah Bayar / Belum Bayar** langsung dari tabel.
- Cari (search) berdasarkan no invoice, nama barang, atau faktur jual.
- Filter berdasarkan status pembayaran.
- Tambah, edit, hapus transaksi.
- Ringkasan: total transaksi, total sudah/belum bayar, total omzet yang belum dibayar.
- Data awal (488 baris) sudah dimigrasi dari `Laporan pembayaran 21052026.xlsx`
  ke `data/transactions-seed.json`, siap di-import ke database.

## Menjalankan di lokal (development)

Butuh PHP 7.4+ (dengan extension `pdo_mysql`) dan akses ke server MySQL.

```bash
cp config.sample.php config.php
# edit config.php, isi kredensial database MySQL lokal Anda

# buat tabel (lewat phpMyAdmin, import sql/schema.sql - atau mysql CLI)
mysql -u root -p nama_database < sql/schema.sql

php scripts/migrate_data.php     # import data awal dari data/transactions-seed.json
php scripts/create_admin.php admin PasswordKuat123!

php -S localhost:8000
# buka http://localhost:8000/login.php
```

## Deploy ke cPanel (production)

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan lengkap step-by-step: buat
subdomain, buat database MySQL di cPanel, upload file lewat File Manager,
import data, dan buat akun admin — semuanya bisa lewat browser, tidak perlu
akses Terminal/SSH.

## Struktur folder

```
config.sample.php    template config database (salin jadi config.php di server)
login.php              halaman login
logout.php             hapus sesi & redirect ke login
index.php               dashboard (butuh login)
api/transactions.php    satu file API: list/search, summary, create, update, toggle status, delete
css/style.css            styling
js/app.js                 logic frontend (fetch ke api/transactions.php)
sql/schema.sql             skema tabel users & transactions
scripts/migrate_data.php   import data/transactions-seed.json ke database (hapus setelah dipakai)
scripts/create_admin.php   buat / reset akun admin (hapus setelah dipakai)
data/transactions-seed.json  hasil migrasi dari file Excel (tidak ada di git)
tools/convert-excel-to-json.js  (dijalankan di laptop pakai Node.js, bukan di server) ubah Excel jadi JSON
```
