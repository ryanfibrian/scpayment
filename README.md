# SC Payment - Vicmic

Aplikasi internal untuk melacak status pembayaran transaksi (sudah bayar /
belum bayar), migrasi dari data Excel "Laporan pembayaran". Rencana deploy di
`scpayment.vicmic.id`.

Stack: Node.js + Express + MySQL, session login (single admin account),
frontend vanilla HTML/CSS/JS (tanpa framework, supaya ringan di shared hosting).

## Fitur

- Login admin (username & password, session tersimpan di file).
- Tabel transaksi: No Invoice, Nama Barang, Harga Beli, Faktur Jual, Harga Jual, Catatan.
- Centang status **Sudah Bayar / Belum Bayar** langsung dari tabel.
- Cari (search) berdasarkan no invoice, nama barang, atau faktur jual.
- Filter berdasarkan status pembayaran.
- Tambah, edit, hapus transaksi.
- Ringkasan: total transaksi, total sudah/belum bayar, total omzet yang belum dibayar.
- Data awal (488 baris) sudah dimigrasi dari `Laporan pembayaran 21052026.xlsx`
  ke `data/transactions-seed.json`, siap di-import ke database.

## Menjalankan di lokal (development)

Butuh Node.js 16+ dan akses ke server MySQL (lokal atau remote).

```bash
npm install
cp .env.example .env
# edit .env, isi kredensial database MySQL lokal Anda

npm run migrate:schema   # buat tabel
npm run migrate:data     # import 488 baris data awal dari data/transactions-seed.json
node scripts/create-admin.js admin PasswordKuat123!

npm start
# buka http://localhost:3000
```

## Deploy ke cPanel (production)

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan lengkap step-by-step: buat
subdomain, buat database MySQL di cPanel, setup Node.js App, import data, dan
buat akun admin.

## Struktur folder

```
server.js                  entry point Express
config/db.js                koneksi pool MySQL
middleware/auth.js          proteksi route yang butuh login
routes/auth.js               login / logout / cek sesi
routes/transactions.js       CRUD transaksi + search + summary
public/                      frontend (login.html, index.html, css, js)
sql/schema.sql                skema tabel users & transactions
scripts/migrate-schema.js     jalankan schema.sql ke database
scripts/migrate-data.js       import data/transactions-seed.json ke database
scripts/create-admin.js       buat / reset akun admin
scripts/convert-excel-to-json.js  (one-off, dijalankan lokal) ubah Excel jadi JSON
data/transactions-seed.json   hasil migrasi dari file Excel
```
