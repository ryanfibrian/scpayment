require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const { requireLogin } = require('./middleware/auth');

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new FileStore({ path: path.join(__dirname, 'sessions'), logFn: () => {} }),
    secret: process.env.SESSION_SECRET || 'ganti-secret-ini',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 12, // 12 jam
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.redirect('/login.html');
});

app.get('*', (req, res) => {
  res.status(404).send('Halaman tidak ditemukan.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
