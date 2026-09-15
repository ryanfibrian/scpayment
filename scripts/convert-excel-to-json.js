// Alat bantu SEKALI PAKAI (dijalankan lokal, tidak perlu di-deploy ke server):
// Mengubah file Excel "Laporan pembayaran" menjadi data/transactions-seed.json
// supaya proses import ke server TIDAK perlu dependency "xlsx" (ada isu keamanan
// yang belum ada fix-nya di versi npm publik).
//
// Cara pakai:
//   node scripts/convert-excel-to-json.js "C:\path\ke\Laporan pembayaran 21052026.xlsx"

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function cleanText(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

const filePath = process.argv[2];
if (!filePath || !fs.existsSync(filePath)) {
  console.error('File Excel tidak ditemukan. Contoh pakai:');
  console.error('  node scripts/convert-excel-to-json.js "C:\\path\\ke\\file.xlsx"');
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

const records = [];
for (let i = 1; i < rows.length; i++) {
  const row = rows[i] || [];
  const no_invoice = cleanText(row[1]);
  const nama_barang = cleanText(row[2]);
  const harga_beli = parseNumber(row[3]);
  const faktur_jual = cleanText(row[4]);
  const harga_jual = parseNumber(row[5]);

  if (!no_invoice && !nama_barang && !faktur_jual) continue;

  records.push({ no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual });
}

const outDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'transactions-seed.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');

console.log(`Berhasil. ${records.length} baris ditulis ke ${outPath}`);
