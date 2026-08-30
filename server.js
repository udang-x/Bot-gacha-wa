const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// 🔒 Kunci Rahasia API
const API_SECRET = "KunciRahasiaBotGacha123";

// Middleware Proteksi Header
app.use((req, res, next) => {
    if (req.path === '/') return next();
    
    const clientKey = req.headers['x-api-key'];
    if (clientKey !== API_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Akses ditolak!' });
    }
    next();
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));

const PORT = process.env.PORT || 3000;
const CARDS_PATH = path.join(__dirname, 'cards.json');
const FRAMES_PATH = path.join(__dirname, 'frames.json');

app.get('/', (req, res) => {
    res.json({ status: 'Gacha Backend Server (Static Assets) is Running!' });
});

// Endpoint Master Data Kartu
app.get('/api/cards', (req, res) => {
    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ error: 'Cards database not found on server.' });
    }
    const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    res.json(cards);
});

// Endpoint Master Data Frame
app.get('/api/frames', (req, res) => {
    if (!fs.existsSync(FRAMES_PATH)) {
        return res.status(404).json({ error: 'Frames database not found on server.' });
    }
    const frames = JSON.parse(fs.readFileSync(FRAMES_PATH, 'utf8'));
    res.json(frames);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server aset pusat berjalan di port ${PORT}`);
});
