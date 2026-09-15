// Membuat / mereset akun admin.
//
// Cara pakai:
//   node scripts/create-admin.js <username> <password>
// atau isi ADMIN_USERNAME & ADMIN_PASSWORD di .env lalu jalankan tanpa argumen:
//   node scripts/create-admin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function main() {
  const username = process.argv[2] || process.env.ADMIN_USERNAME;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('Username / password belum diisi. Contoh pakai:');
    console.error('  node scripts/create-admin.js admin PasswordKuat123!');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password minimal 8 karakter.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (existing.length > 0) {
    await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username]);
    console.log(`Password untuk user "${username}" berhasil di-reset.`);
  } else {
    await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
    console.log(`User admin "${username}" berhasil dibuat.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Gagal membuat admin:', err.message);
  process.exit(1);
});
