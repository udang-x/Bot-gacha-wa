const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// 👉 TAMBAHKAN BARIS INI (Supaya folder assets bisa diakses publik lewat internet)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const PORT = process.env.PORT || 3000;
const CARDS_PATH = path.join(__dirname, 'cards.json');

// 1. Endpoint untuk mengecek apakah server aktif
app.get('/', (req, res) => {
    res.json({ status: 'Gacha Backend Server is Running!' });
});

// 2. Endpoint untuk mengambil daftar kartu (diambil oleh bot client)
app.get('/api/cards', (req, res) => {
    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ error: 'Cards database not found on server.' });
    }
    const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    res.json(cards);
});

// 3. Menjalankan server
app.listen(PORT, () => {
    console.log(`🚀 Server pusat berjalan di port ${PORT}`);
});
