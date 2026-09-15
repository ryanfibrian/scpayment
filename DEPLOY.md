# Panduan Deploy ke cPanel (scpayment.vicmic.id)

Aplikasi ini murni **PHP + MySQL** — tidak pakai Node.js, tidak perlu "Setup
Node.js App", tidak perlu npm install. Tinggal upload file `.php` ke folder
subdomain, sama seperti deploy WordPress/PHP biasa.

---

## 1. Buat Subdomain

1. Login ke cPanel `vicmic.id`.
2. Buka **Domains** (atau **Subdomains** di cPanel versi lama).
3. Buat subdomain: `scpayment` domain `vicmic.id` → jadi `scpayment.vicmic.id`.
4. Catat **Document Root**-nya, biasanya otomatis jadi sesuatu seperti
   `/home/vicmicid/scpayment.vicmic.id` — folder inilah tempat semua file PHP
   nanti diupload (**bukan** folder `public_html`, dan bukan folder Node.js
   `scpayment` yang lama kalau sempat dibuat — itu boleh dihapus, lihat catatan
   di bagian bawah).

## 2. Buat Database MySQL

(Lewati langkah ini kalau sudah pernah buat database untuk percobaan Node.js
sebelumnya — tinggal dipakai ulang.)

1. Buka cPanel > **MySQL® Databases**.
2. Buat database baru, misal `vicmic_scpayment`.
3. Buat user MySQL baru, misal `vicmic_scpayment_user`, dengan password kuat.
4. Tambahkan user tersebut ke database dengan hak akses **ALL PRIVILEGES**.
5. Catat: nama database lengkap, username lengkap (biasanya ada prefix akun
   cPanel, misal `namacpanel_vicmic_scpayment`), dan passwordnya.

## 3. Upload Kode Aplikasi

1. Di komputer lokal, buat file zip dari folder project ini, **kecuali**
   `.git/` dan `tools/node_modules/` (kalau ada).
   - Cara cepat lewat PowerShell (dari dalam folder project):
     ```powershell
     Compress-Archive -Path api,css,js,scripts,sql,config.sample.php,index.php,login.php,logout.php -DestinationPath scpayment-deploy.zip
     ```
2. Login cPanel `vicmic.id` > **File Manager**.
3. Masuk ke folder document root subdomain dari Langkah 1
   (misal `/home/vicmicid/scpayment.vicmic.id`).
4. Klik **Upload**, upload file zip tadi.
5. Setelah selesai, klik kanan file zip > **Extract** langsung di folder itu
   (bukan di dalam subfolder baru), lalu hapus file zip-nya.
6. Upload juga `data/transactions-seed.json` dari laptop kamu ke folder
   `data/` di server (bikin folder `data` dulu kalau belum ada saat extract).
   File ini sengaja **tidak** ada di repo GitHub karena berisi data bisnis
   asli (nama barang, harga, no invoice).

## 4. Setup config.php

1. Di File Manager, cari file **config.sample.php**, klik kanan > **Copy**,
   simpan salinannya dengan nama **config.php** (di folder yang sama, folder
   paling atas / document root).
2. Klik kanan `config.php` > **Edit**, isi:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'namacpanel_vicmic_scpayment');
   define('DB_USER', 'namacpanel_vicmic_scpayment_user');
   define('DB_PASS', 'password_yang_dibuat_di_langkah_2');
   define('SETUP_TOKEN', 'ganti_dengan_string_acak_bebas_yang_cuma_kamu_tahu');
   ```
3. Simpan.

## 5. Buat Tabel & Import Data

**Kalau ada akses Terminal di cPanel** (menu **Terminal**):

```bash
cd /home/vicmicid/scpayment.vicmic.id

# (skip kalau belum ada mysql client / mau lewat phpMyAdmin saja di bawah)
mysql -u namacpanel_vicmic_scpayment_user -p namacpanel_vicmic_scpayment < sql/schema.sql

php scripts/migrate_data.php

# GANTI username & password di bawah ini!
php scripts/create_admin.php admin PasswordKuatAnda123!
```

**Kalau tidak ada Terminal**, semua bisa dilakukan lewat browser:

1. **Buat tabel** — buka cPanel > **phpMyAdmin**, pilih database yang dibuat
   di Langkah 2, klik tab **Import**, upload file `sql/schema.sql`, klik **Go**.
2. **Import data** — buka di browser:
   ```
   https://scpayment.vicmic.id/scripts/migrate_data.php?token=ISI_SETUP_TOKEN_DI_CONFIG
   ```
3. **Buat akun admin** — buka di browser (ganti username/password):
   ```
   https://scpayment.vicmic.id/scripts/create_admin.php?token=ISI_SETUP_TOKEN&username=admin&password=PasswordKuatAnda123!
   ```

## 6. Selesai — Bersih-bersih

1. Buka `https://scpayment.vicmic.id`, login dengan akun admin dari Langkah 5.
2. **Hapus folder `scripts/`** dari server (lewat File Manager) setelah kedua
   script di atas selesai dijalankan — supaya tidak ada yang bisa
   membuat/reset akun admin lewat URL itu lagi.
3. Kalau sebelumnya sempat membuat **Node.js App** & folder `scpayment`
   (bukan `scpayment.vicmic.id`) untuk percobaan yang gagal — boleh dihapus:
   - cPanel > **Setup Node.js App** > hapus aplikasi "scpayment" (kalau ada).
   - File Manager > hapus folder `/home/vicmicid/scpayment` (folder lama,
     bukan folder subdomain `scpayment.vicmic.id` yang baru dipakai ini).
4. SSL: cPanel biasanya otomatis menyediakan SSL gratis (AutoSSL) untuk
   subdomain baru dalam beberapa menit–jam. Cek cPanel > SSL/TLS Status kalau
   belum aktif.

---

## Kalau nanti mau update data lagi dari Excel

1. Di laptop (bukan di server):
   ```bash
   npm install xlsx --no-save
   node tools/convert-excel-to-json.js "C:\path\ke\file-excel-baru.xlsx"
   npm uninstall xlsx
   ```
2. Upload ulang `data/transactions-seed.json` ke server (timpa yang lama).
3. Kalau folder `scripts/` sudah dihapus (Langkah 6.2), upload dulu ulang
   file `scripts/migrate_data.php`, lalu jalankan
   `php scripts/migrate_data.php --force` (Terminal) atau lewat browser
   dengan `&force=1`. Hapus lagi folder `scripts/` setelah selesai.

## Reset password admin

Sama seperti Langkah 5 di atas — upload ulang `scripts/create_admin.php` kalau
sudah dihapus, jalankan lagi dengan username/password baru, lalu hapus lagi.
