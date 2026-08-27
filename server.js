const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/assets', express.static(path.join(__dirname, 'assets')));

const PORT = process.env.PORT || 3000;
const CARDS_PATH = path.join(__dirname, 'cards.json');

app.get('/', (req, res) => {
    res.json({ status: 'Gacha Backend Server is Running!' });
});

app.get('/api/cards', (req, res) => {
    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ error: 'Cards database not found on server.' });
    }
    const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    res.json(cards);
});

app.post('/api/givecard', (req, res) => {
    const { senderNumber, targetUser, cardId } = req.body;
    
    const cleanSender = senderNumber ? String(senderNumber).replace(/[^0-9]/g, '') : '';
    
    // 🔍 CETAK KE LOG: Kita lihat angka bersih apa yang dikirim oleh WhatsApp kamu
    console.log("==========================================");
    console.log("📱 NOMOR MENTAH DARI KLIEN:", senderNumber);
    console.log("🧹 NOMOR SETELAH DIBERSIHKAN:", cleanSender);
    console.log("==========================================");

    // 🛡️ SEMENTARA DIBYPASS (Tidak ada penolakan 403 dulu)
    // Tujuannya agar perintah .givecard langsung sukses, lalu kita intip angka aslinya di log Railway.
    res.json({ 
        success: true, 
        message: "✅ Kartu berhasil diberikan oleh Owner!" 
    });
});

// Wajib menggunakan '0.0.0.0' agar port Railway terbuka untuk publik dan tidak crash
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server pusat berjalan di port ${PORT}`);
});
