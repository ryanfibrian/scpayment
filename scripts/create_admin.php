<?php
// Membuat / mereset akun admin.
//
// Cara pakai lewat Terminal cPanel:
//   php scripts/create_admin.php admin PasswordKuat123!
//
// Cara pakai lewat browser (kalau tidak ada akses Terminal):
//   https://scpayment.vicmic.id/scripts/create_admin.php?token=ISI_SETUP_TOKEN&username=admin&password=PasswordKuat123!

require_once __DIR__ . '/../config.php';

$isCli = (php_sapi_name() === 'cli');

if ($isCli) {
    $username = $argv[1] ?? null;
    $password = $argv[2] ?? null;
} else {
    if (($_GET['token'] ?? '') !== SETUP_TOKEN) {
        http_response_code(403);
        die('Forbidden. Tambahkan ?token=... sesuai SETUP_TOKEN di config.php');
    }
    header('Content-Type: text/plain');
    $username = $_GET['username'] ?? null;
    $password = $_GET['password'] ?? null;
}

if (!$username || !$password) {
    $usage = $isCli
        ? "php scripts/create_admin.php <username> <password>\n"
        : "?token=...&username=admin&password=PasswordKuat123!\n";
    die("Username / password belum diisi. Contoh pakai:\n$usage");
}
if (strlen($password) < 8) {
    die("Password minimal 8 karakter.\n");
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$pdo = db();

$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
$existing = $stmt->fetch();

if ($existing) {
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE username = ?')->execute([$hash, $username]);
    echo "Password untuk user \"$username\" berhasil di-reset.\n";
} else {
    $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')->execute([$username, $hash]);
    echo "User admin \"$username\" berhasil dibuat.\n";
}
