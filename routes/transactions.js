const express = require('express');
const pool = require('../config/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// GET /api/transactions?q=&status=all|paid|unpaid&page=&limit=
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const status = req.query.status || 'all';
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (q) {
      where.push('(no_invoice LIKE ? OR nama_barang LIKE ? OR faktur_jual LIKE ? OR catatan LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (status === 'paid') where.push('sudah_bayar = 1');
    if (status === 'unpaid') where.push('sudah_bayar = 0');

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT * FROM transactions ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions ${whereSql}`,
      params
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page,
      totalPages: Math.ceil(countRows[0].total / limit) || 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data.' });
  }
});

// GET /api/transactions/summary
router.get('/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_transaksi,
        SUM(sudah_bayar = 1) AS total_sudah_bayar,
        SUM(sudah_bayar = 0) AS total_belum_bayar,
        COALESCE(SUM(CASE WHEN sudah_bayar = 0 THEN harga_jual ELSE 0 END), 0) AS omzet_belum_bayar,
        COALESCE(SUM(CASE WHEN sudah_bayar = 1 THEN harga_jual ELSE 0 END), 0) AS omzet_sudah_bayar
      FROM transactions
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil ringkasan.' });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual, catatan, sudah_bayar } = req.body;
    if (!nama_barang) {
      return res.status(400).json({ error: 'Nama barang wajib diisi.' });
    }
    const [result] = await pool.query(
      `INSERT INTO transactions (no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual, catatan, sudah_bayar, tanggal_bayar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        no_invoice || null,
        nama_barang,
        harga_beli || null,
        faktur_jual || null,
        harga_jual || null,
        catatan || null,
        sudah_bayar ? 1 : 0,
        sudah_bayar ? new Date() : null,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menambah data.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { no_invoice, nama_barang, harga_beli, faktur_jual, harga_jual, catatan } = req.body;
    if (!nama_barang) {
      return res.status(400).json({ error: 'Nama barang wajib diisi.' });
    }
    const [result] = await pool.query(
      `UPDATE transactions SET no_invoice = ?, nama_barang = ?, harga_beli = ?, faktur_jual = ?, harga_jual = ?, catatan = ?
       WHERE id = ?`,
      [no_invoice || null, nama_barang, harga_beli || null, faktur_jual || null, harga_jual || null, catatan || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengubah data.' });
  }
});

// PATCH /api/transactions/:id/status  { sudah_bayar: boolean }
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const sudahBayar = !!req.body.sudah_bayar;
    const [result] = await pool.query(
      'UPDATE transactions SET sudah_bayar = ?, tanggal_bayar = ? WHERE id = ?',
      [sudahBayar ? 1 : 0, sudahBayar ? new Date() : null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengubah status pembayaran.' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data tidak ditemukan.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus data.' });
  }
});

module.exports = router;
