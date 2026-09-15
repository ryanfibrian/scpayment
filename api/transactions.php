<?php
require_once __DIR__ . '/../config.php';
require_login_api();

header('Content-Type: application/json');

function input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = db();

    if ($method === 'GET' && $action === 'summary') {
        $row = $pdo->query("
            SELECT
              COUNT(*) AS total_transaksi,
              SUM(sudah_bayar = 1) AS total_sudah_bayar,
              SUM(sudah_bayar = 0) AS total_belum_bayar,
              COALESCE(SUM(CASE WHEN sudah_bayar = 0 THEN harga_jual ELSE 0 END), 0) AS omzet_belum_bayar,
              COALESCE(SUM(CASE WHEN sudah_bayar = 1 THEN harga_jual ELSE 0 END), 0) AS omzet_sudah_bayar
            FROM transactions
        ")->fetch();
        out($row);
    }

    if ($method === 'GET' && $action === 'list') {
        $q = trim($_GET['q'] ?? '');
        $status = $_GET['status'] ?? 'all';
        $page = max((int) ($_GET['page'] ?? 1), 1);
        $limit = min(max((int) ($_GET['limit'] ?? 100), 1), 500);
        $offset = ($page - 1) * $limit;

        $dateFrom = $_GET['date_from'] ?? '';
        $dateTo = $_GET['date_to'] ?? '';

        $where = [];
        $params = [];
        if ($q !== '') {
            $where[] = '(no_invoice LIKE ? OR nama_barang LIKE ? OR faktur_jual LIKE ? OR catatan LIKE ?)';
            $like = "%$q%";
            array_push($params, $like, $like, $like, $like);
        }
        if ($status === 'paid') $where[] = 'sudah_bayar = 1';
        if ($status === 'unpaid') $where[] = 'sudah_bayar = 0';
        if ($dateFrom !== '') {
            $where[] = 'DATE(created_at) >= ?';
            $params[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = 'DATE(created_at) <= ?';
            $params[] = $dateTo;
        }
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $stmt = $pdo->prepare("SELECT * FROM transactions $whereSql ORDER BY created_at DESC, id DESC LIMIT $limit OFFSET $offset");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $countStmt = $pdo->prepare("SELECT COUNT(*) AS total FROM transactions $whereSql");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetch()['total'];

        out([
            'data' => $rows,
            'total' => $total,
            'page' => $page,
            'totalPages' => max((int) ceil($total / $limit), 1),
        ]);
    }

    if ($method === 'POST' && $action === 'create') {
        $d = input();
        if (empty($d['nama_barang'])) out(['error' => 'Nama barang wajib diisi.'], 400);

        $sudahBayar = !empty($d['sudah_bayar']) ? 1 : 0;
        $stmt = $pdo->prepare(
            'INSERT INTO transactions (no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual, catatan, sudah_bayar, tanggal_bayar)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $d['no_invoice'] ?? null,
            $d['nama_barang'],
            $d['harga_beli'] ?? null,
            $d['faktur_jual'] ?? null,
            $d['harga_jual'] ?? null,
            $d['catatan'] ?? null,
            $sudahBayar,
            $sudahBayar ? date('Y-m-d') : null,
        ]);

        $id = $pdo->lastInsertId();
        $row = $pdo->prepare('SELECT * FROM transactions WHERE id = ?');
        $row->execute([$id]);
        out($row->fetch(), 201);
    }

    if ($method === 'POST' && $action === 'update') {
        $id = (int) ($_GET['id'] ?? 0);
        $d = input();
        if (empty($d['nama_barang'])) out(['error' => 'Nama barang wajib diisi.'], 400);

        $stmt = $pdo->prepare(
            'UPDATE transactions SET no_invoice = ?, nama_barang = ?, harga_beli = ?, faktur_jual = ?, harga_jual = ?, catatan = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $d['no_invoice'] ?? null,
            $d['nama_barang'],
            $d['harga_beli'] ?? null,
            $d['faktur_jual'] ?? null,
            $d['harga_jual'] ?? null,
            $d['catatan'] ?? null,
            $id,
        ]);

        $row = $pdo->prepare('SELECT * FROM transactions WHERE id = ?');
        $row->execute([$id]);
        $data = $row->fetch();
        if (!$data) out(['error' => 'Data tidak ditemukan.'], 404);
        out($data);
    }

    if ($method === 'POST' && $action === 'toggle') {
        $id = (int) ($_GET['id'] ?? 0);
        $d = input();
        $sudahBayar = !empty($d['sudah_bayar']) ? 1 : 0;

        $stmt = $pdo->prepare('UPDATE transactions SET sudah_bayar = ?, tanggal_bayar = ? WHERE id = ?');
        $stmt->execute([$sudahBayar, $sudahBayar ? date('Y-m-d') : null, $id]);

        $row = $pdo->prepare('SELECT * FROM transactions WHERE id = ?');
        $row->execute([$id]);
        $data = $row->fetch();
        if (!$data) out(['error' => 'Data tidak ditemukan.'], 404);
        out($data);
    }

    if ($method === 'POST' && $action === 'delete') {
        $id = (int) ($_GET['id'] ?? 0);
        $stmt = $pdo->prepare('DELETE FROM transactions WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) out(['error' => 'Data tidak ditemukan.'], 404);
        out(['ok' => true]);
    }

    out(['error' => 'Aksi tidak dikenali.'], 400);
} catch (Throwable $e) {
    out(['error' => 'Terjadi kesalahan server.'], 500);
}
