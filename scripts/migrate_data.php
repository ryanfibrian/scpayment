<?php
// Import data awal dari data/transactions-seed.json ke tabel `transactions`.
//
// Cara pakai lewat Terminal cPanel:
//   php scripts/migrate_data.php
//   php scripts/migrate_data.php --force   (kalau tabel sudah ada isinya tapi tetap mau import)
//
// Cara pakai lewat browser (kalau tidak ada akses Terminal):
//   https://scpayment.vicmic.id/scripts/migrate_data.php?token=ISI_SETUP_TOKEN
//   tambahkan &force=1 di belakang kalau tabel sudah ada isinya

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    header('Content-Type: text/plain');
}

$configPath = __DIR__ . '/../config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    die("config.php tidak ditemukan di document root. Copy config.sample.php jadi config.php dulu, isi kredensial database-nya (lihat DEPLOY.md Langkah 4).\n");
}
require_once $configPath;

if ($isCli) {
    $force = in_array('--force', $argv ?? [], true);
} else {
    if (($_GET['token'] ?? '') !== SETUP_TOKEN) {
        http_response_code(403);
        die('Forbidden. Tambahkan ?token=... sesuai SETUP_TOKEN di config.php');
    }
    $force = ($_GET['force'] ?? '') === '1';
}

$jsonPath = __DIR__ . '/../data/transactions-seed.json';
if (!file_exists($jsonPath)) {
    die("File data/transactions-seed.json tidak ditemukan. Upload dulu file itu ke folder data/.\n");
}

$records = json_decode(file_get_contents($jsonPath), true);
if (!is_array($records)) {
    die("File JSON tidak valid.\n");
}
echo 'Ditemukan ' . count($records) . " baris data.\n";

try {
    $pdo = db();

    $existing = (int) $pdo->query('SELECT COUNT(*) AS total FROM transactions')->fetch()['total'];
    if ($existing > 0 && !$force) {
        $flag = $isCli ? '--force' : '&force=1';
        die("Tabel transactions sudah berisi $existing baris. Tambahkan $flag kalau memang mau tetap import (bisa duplikat).\n");
    }

    // Tanggal laporan Excel aslinya (dari nama file "Laporan pembayaran 21052026")
    // dipakai sebagai tanggal transaksi untuk semua baris hasil import, supaya
    // data lama ini jadi satu kelompok "histori" yang jelas beda dari entri
    // baru yang ditambahkan lewat aplikasi (created_at = waktu saat ini).
    $importDate = '2026-05-21 00:00:00';

    $stmt = $pdo->prepare(
        'INSERT INTO transactions (no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    $inserted = 0;
    foreach ($records as $r) {
        $stmt->execute([
            $r['no_invoice'] ?? null,
            $r['nama_barang'] ?? null,
            $r['harga_beli'] ?? null,
            $r['faktur_jual'] ?? null,
            $r['harga_jual'] ?? null,
            $importDate,
        ]);
        $inserted++;
    }

    echo "Selesai. $inserted baris ter-import.\n";
} catch (Throwable $e) {
    http_response_code(500);
    echo "Gagal konek/insert ke database: " . $e->getMessage() . "\n";
    echo "Cek lagi DB_HOST/DB_NAME/DB_USER/DB_PASS di config.php, dan pastikan tabel sudah dibuat dari sql/schema.sql.\n";
}
