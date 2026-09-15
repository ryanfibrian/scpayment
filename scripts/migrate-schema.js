require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log('Menjalankan schema.sql ...');
  await connection.query(sql);
  console.log('Selesai. Tabel users & transactions sudah siap.');

  await connection.end();
}

main().catch((err) => {
  console.error('Gagal menjalankan migrasi skema:', err.message);
  process.exit(1);
});
