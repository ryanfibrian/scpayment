const state = {
  page: 1,
  limit: 100,
  q: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  totalPages: 1,
};

const API = 'api/transactions.php';

const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('emptyState');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const txForm = document.getElementById('txForm');
const txSudahBayarRow = document.getElementById('txSudahBayarRow');

function formatRupiah(n) {
  const num = Number(n);
  if (!n || Number.isNaN(num)) return '-';
  return 'Rp ' + num.toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadSummary() {
  const res = await fetch(`${API}?action=summary`);
  if (res.status === 401) return (window.location.href = 'login.php');
  if (!res.ok) return;
  const s = await res.json();
  document.getElementById('sumTotal').textContent = s.total_transaksi ?? 0;
  document.getElementById('sumPaid').textContent = s.total_sudah_bayar ?? 0;
  document.getElementById('sumUnpaid').textContent = s.total_belum_bayar ?? 0;
  document.getElementById('sumOmzetUnpaid').textContent = formatRupiah(s.omzet_belum_bayar);
}

async function loadTransactions() {
  const params = new URLSearchParams({
    action: 'list',
    q: state.q,
    status: state.status,
    date_from: state.dateFrom,
    date_to: state.dateTo,
    page: state.page,
    limit: state.limit,
  });
  const res = await fetch(`${API}?${params.toString()}`);
  if (res.status === 401) return (window.location.href = 'login.php');
  const data = await res.json();
  state.totalPages = data.totalPages;
  renderTable(data.data);
  renderPagination(data.total);
}

function renderTable(rows) {
  tableBody.innerHTML = '';
  if (!rows.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatTanggal(row.created_at)}</td>
      <td>${escapeHtml(row.no_invoice)}</td>
      <td>${escapeHtml(row.nama_barang)}</td>
      <td>${formatRupiah(row.harga_beli)}</td>
      <td>${escapeHtml(row.faktur_jual)}</td>
      <td>${formatRupiah(row.harga_jual)}</td>
      <td>${escapeHtml(row.catatan)}</td>
      <td>
        <span class="badge ${row.sudah_bayar == 1 ? 'paid' : 'unpaid'}" data-id="${row.id}" data-action="toggle">
          ${row.sudah_bayar == 1 ? '✓ Sudah Bayar' : '✗ Belum Bayar'}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" data-id="${row.id}">Edit</button>
          <button class="icon-btn" data-action="delete" data-id="${row.id}">Hapus</button>
        </div>
      </td>
    `;
    tr.dataset.row = JSON.stringify(row);
    tableBody.appendChild(tr);
  }
}

function renderPagination(total) {
  pagination.innerHTML = '';
  if (state.totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-secondary';
  prevBtn.textContent = 'Sebelumnya';
  prevBtn.disabled = state.page <= 1;
  prevBtn.onclick = () => { state.page--; loadTransactions(); };

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-secondary';
  nextBtn.textContent = 'Berikutnya';
  nextBtn.disabled = state.page >= state.totalPages;
  nextBtn.onclick = () => { state.page++; loadTransactions(); };

  const info = document.createElement('span');
  info.textContent = `Halaman ${state.page} dari ${state.totalPages} (${total} data)`;

  pagination.appendChild(prevBtn);
  pagination.appendChild(info);
  pagination.appendChild(nextBtn);
}

let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.q = searchInput.value.trim();
    state.page = 1;
    loadTransactions();
  }, 300);
});

statusFilter.addEventListener('change', () => {
  state.status = statusFilter.value;
  state.page = 1;
  loadTransactions();
});

dateFromInput.addEventListener('change', () => {
  state.dateFrom = dateFromInput.value;
  state.page = 1;
  loadTransactions();
});

dateToInput.addEventListener('change', () => {
  state.dateTo = dateToInput.value;
  state.page = 1;
  loadTransactions();
});

document.getElementById('clearDateBtn').addEventListener('click', () => {
  dateFromInput.value = '';
  dateToInput.value = '';
  state.dateFrom = '';
  state.dateTo = '';
  state.page = 1;
  loadTransactions();
});

// ---------- Table row actions (delegated) ----------
tableBody.addEventListener('click', async (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  const tr = target.closest('tr');
  const row = JSON.parse(tr.dataset.row);

  if (action === 'toggle') {
    const newStatus = !(row.sudah_bayar == 1);
    target.style.opacity = '0.5';
    const res = await fetch(`${API}?action=toggle&id=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sudah_bayar: newStatus }),
    });
    if (res.ok) {
      await loadTransactions();
      await loadSummary();
    } else {
      target.style.opacity = '1';
      alert('Gagal mengubah status.');
    }
  }

  if (action === 'edit') {
    openModal(row);
  }

  if (action === 'delete') {
    if (!confirm(`Hapus data "${row.nama_barang}"?`)) return;
    const res = await fetch(`${API}?action=delete&id=${id}`, { method: 'POST' });
    if (res.ok) {
      await loadTransactions();
      await loadSummary();
    } else {
      alert('Gagal menghapus data.');
    }
  }
});

// ---------- Modal add / edit ----------
function openModal(row) {
  txForm.reset();
  document.getElementById('txId').value = row ? row.id : '';
  document.getElementById('txNoInvoice').value = row ? row.no_invoice || '' : '';
  document.getElementById('txNamaBarang').value = row ? row.nama_barang || '' : '';
  document.getElementById('txHargaBeli').value = row ? row.harga_beli || '' : '';
  document.getElementById('txFakturJual').value = row ? row.faktur_jual || '' : '';
  document.getElementById('txHargaJual').value = row ? row.harga_jual || '' : '';
  document.getElementById('txCatatan').value = row ? row.catatan || '' : '';
  document.getElementById('txSudahBayar').checked = row ? row.sudah_bayar == 1 : false;

  txSudahBayarRow.style.display = row ? 'none' : 'flex';

  modalTitle.textContent = row ? 'Edit Transaksi' : 'Tambah Transaksi';
  modalOverlay.classList.add('show');
}

function closeModal() {
  modalOverlay.classList.remove('show');
}

document.getElementById('addBtn').addEventListener('click', () => openModal(null));
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

txForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('txId').value;
  const payload = {
    no_invoice: document.getElementById('txNoInvoice').value.trim() || null,
    nama_barang: document.getElementById('txNamaBarang').value.trim(),
    harga_beli: document.getElementById('txHargaBeli').value || null,
    faktur_jual: document.getElementById('txFakturJual').value.trim() || null,
    harga_jual: document.getElementById('txHargaJual').value || null,
    catatan: document.getElementById('txCatatan').value.trim() || null,
  };
  if (!id) {
    payload.sudah_bayar = document.getElementById('txSudahBayar').checked;
  }

  const action = id ? 'update' : 'create';
  const idParam = id ? `&id=${id}` : '';

  const res = await fetch(`${API}?action=${action}${idParam}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    closeModal();
    await loadTransactions();
    await loadSummary();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Gagal menyimpan data.');
  }
});

// ---------- Init ----------
(async function init() {
  await loadSummary();
  await loadTransactions();
})();
