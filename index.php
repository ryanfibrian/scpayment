<?php
require_once __DIR__ . '/config.php';
require_login();
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SC Payment - Dashboard</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div class="topbar">
    <h1>SC Payment</h1>
    <div class="user-info">
      <span><?= htmlspecialchars($_SESSION['username']) ?></span>
      <a href="logout.php" class="btn btn-secondary">Keluar</a>
    </div>
  </div>

  <div class="container">
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total Transaksi</div>
        <div class="value" id="sumTotal">-</div>
      </div>
      <div class="summary-card green">
        <div class="label">Sudah Bayar</div>
        <div class="value" id="sumPaid">-</div>
      </div>
      <div class="summary-card red">
        <div class="label">Belum Bayar</div>
        <div class="value" id="sumUnpaid">-</div>
      </div>
      <div class="summary-card red">
        <div class="label">Omzet Belum Dibayar</div>
        <div class="value" id="sumOmzetUnpaid">-</div>
      </div>
    </div>

    <div class="toolbar">
      <input type="text" id="searchInput" placeholder="Cari no invoice, nama barang, atau faktur jual..." />
      <select id="statusFilter">
        <option value="all">Semua Status</option>
        <option value="paid">Sudah Bayar</option>
        <option value="unpaid">Belum Bayar</option>
      </select>
      <label class="date-filter-label">Dari <input type="date" id="dateFrom" /></label>
      <label class="date-filter-label">Sampai <input type="date" id="dateTo" /></label>
      <button class="btn btn-secondary" id="clearDateBtn">Reset Tanggal</button>
      <button class="btn btn-primary" id="addBtn">+ Tambah Transaksi</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>No Invoice</th>
            <th>Nama Barang</th>
            <th>Harga Beli (Include PPN)</th>
            <th>Nomor Accurate</th>
            <th>Harga Jual</th>
            <th>Margin</th>
            <th>Catatan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody id="tableBody">
        </tbody>
      </table>
      <div class="empty-state" id="emptyState" style="display:none;">Tidak ada data.</div>
    </div>

    <div class="pagination" id="pagination"></div>
  </div>

  <!-- Modal tambah / edit -->
  <div class="modal-overlay" id="modalOverlay">
    <div class="modal">
      <h2 id="modalTitle">Tambah Transaksi</h2>
      <form id="txForm">
        <input type="hidden" id="txId" />
        <div class="field">
          <label for="txNoInvoice">No Invoice</label>
          <input type="text" id="txNoInvoice" />
        </div>
        <div class="field">
          <label for="txNamaBarang">Nama Barang *</label>
          <input type="text" id="txNamaBarang" required />
        </div>
        <div class="field">
          <label for="txHargaBeli">Harga Beli (Include PPN)</label>
          <input type="number" id="txHargaBeli" step="0.01" />
        </div>
        <div class="field">
          <label for="txFakturJual">Nomor Accurate</label>
          <input type="text" id="txFakturJual" />
        </div>
        <div class="field">
          <label for="txHargaJual">Harga Jual</label>
          <input type="number" id="txHargaJual" step="0.01" />
        </div>
        <div class="field">
          <label for="txCatatan">Catatan</label>
          <input type="text" id="txCatatan" />
        </div>
        <div class="field checkbox-row" id="txSudahBayarRow">
          <input type="checkbox" id="txSudahBayar" />
          <label for="txSudahBayar" style="margin:0;">Sudah Bayar</label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="modalCancelBtn">Batal</button>
          <button type="submit" class="btn btn-primary" id="modalSaveBtn">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <script src="js/app.js"></script>
</body>
</html>
