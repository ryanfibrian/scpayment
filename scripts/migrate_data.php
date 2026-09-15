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

require_once __DIR__ . '/../config.php';

$isCli = (php_sapi_name() === 'cli');

if ($isCli) {
    $force = in_array('--force', $argv ?? [], true);
} else {
    if (($_GET['token'] ?? '') !== SETUP_TOKEN) {
        http_response_code(403);
        die('Forbidden. Tambahkan ?token=... sesuai SETUP_TOKEN di config.php');
    }
    header('Content-Type: text/plain');
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

$pdo = db();
$existing = (int) $pdo->query('SELECT COUNT(*) AS total FROM transactions')->fetch()['total'];
if ($existing > 0 && !$force) {
    $flag = $isCli ? '--force' : '&force=1';
    die("Tabel transactions sudah berisi $existing baris. Tambahkan $flag kalau memang mau tetap import (bisa duplikat).\n");
}

$stmt = $pdo->prepare(
    'INSERT INTO transactions (no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual) VALUES (?, ?, ?, ?, ?)'
);

$inserted = 0;
foreach ($records as $r) {
    $stmt->execute([
        $r['no_invoice'] ?? null,
        $r['nama_barang'] ?? null,
        $r['harga_beli'] ?? null,
        $r['faktur_jual'] ?? null,
        $r['harga_jual'] ?? null,
    ]);
    $inserted++;
}

echo "Selesai. $inserted baris ter-import.\n";
