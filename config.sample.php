<?php
// Salin file ini menjadi "config.php" (di folder yang sama) lalu isi sesuai
// data database MySQL dari cPanel Anda.
//
// JANGAN commit "config.php" ke git (sudah di-.gitignore) - file itu isinya
// password database asli.

// --- Database MySQL (buat lewat cPanel > MySQL Databases) ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'namacpanel_vicmic_scpayment');
define('DB_USER', 'namacpanel_vicmic_scpayment_user');
define('DB_PASS', 'isi_password_disini');

// --- Token rahasia untuk proteksi script setup sekali-pakai di folder scripts/ ---
// (dipakai kalau setup lewat browser karena tidak ada akses Terminal)
// Ganti dengan string acak bebas. Setelah setup selesai, sebaiknya folder
// scripts/ dihapus saja dari server.
define('SETUP_TOKEN', 'ganti_dengan_string_acak_rahasia_bebas');

// ---------------------------------------------------------------------------
// Tidak perlu diubah di bawah ini.
// ---------------------------------------------------------------------------

session_start();

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }
    return $pdo;
}

// Dipakai di halaman biasa (index.php dst) - redirect ke login kalau belum login.
function require_login(): void {
    if (empty($_SESSION['user_id'])) {
        header('Location: login.php');
        exit;
    }
}

// Dipakai di api/*.php - balas 401 JSON kalau belum login.
function require_login_api(): void {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Belum login.']);
        exit;
    }
}
