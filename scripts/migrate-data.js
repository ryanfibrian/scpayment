// Import data awal dari data/transactions-seed.json ke tabel `transactions`.
//
// File JSON ini sudah dihasilkan sebelumnya dari file Excel
// "Laporan pembayaran" lewat scripts/convert-excel-to-json.js (dijalankan
// sekali secara lokal), supaya server produksi tidak perlu package "xlsx".
//
// Cara pakai:
//   node scripts/migrate-data.js
//   node scripts/migrate-data.js --force   (kalau mau tetap import walau tabel sudah ada isinya)

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

async function main() {
  const force = process.argv.includes('--force');
  const jsonPath = path.join(__dirname, '..', 'data', 'transactions-seed.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`File ${jsonPath} tidak ditemukan.`);
    console.error('Generate dulu dari Excel lewat: node scripts/convert-excel-to-json.js "path/ke/file.xlsx"');
    process.exit(1);
  }

  const records = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Ditemukan ${records.length} baris data di ${jsonPath}.`);

  const [existing] = await pool.query('SELECT COUNT(*) AS total FROM transactions');
  if (existing[0].total > 0 && !force) {
    console.error(
      `Tabel transactions sudah berisi ${existing[0].total} baris. ` +
      'Jalankan ulang dengan --force jika memang mau menambahkan data lagi (bisa duplikat).'
    );
    process.exit(1);
  }

  const rows = records.map((r) => [
    r.no_invoice || null,
    r.nama_barang || null,
    r.harga_beli ?? null,
    r.faktur_jual || null,
    r.harga_jual ?? null,
  ]);

  const batchSize = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await pool.query(
      'INSERT INTO transactions (no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual) VALUES ?',
      [batch]
    );
    inserted += batch.length;
    console.log(`  ${inserted}/${rows.length} baris ter-import ...`);
  }

  console.log('Migrasi data selesai.');
  await pool.end();
}

main().catch((err) => {
  console.error('Gagal migrasi data:', err.message);
  process.exit(1);
});
