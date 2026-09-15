-- Skema database untuk scpayment.vicmic.id
-- Import lewat cPanel > phpMyAdmin (tab Import), pilih database yang sudah
-- dibuat, lalu upload file ini.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_invoice VARCHAR(100) DEFAULT NULL,
  nama_barang VARCHAR(255) DEFAULT NULL,
  harga_beli DECIMAL(15,2) DEFAULT NULL,
  faktur_jual VARCHAR(100) DEFAULT NULL,
  harga_jual DECIMAL(15,2) DEFAULT NULL,
  catatan VARCHAR(500) DEFAULT NULL,
  sudah_bayar TINYINT(1) NOT NULL DEFAULT 0,
  tanggal_bayar DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_no_invoice (no_invoice),
  INDEX idx_faktur_jual (faktur_jual),
  INDEX idx_sudah_bayar (sudah_bayar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
