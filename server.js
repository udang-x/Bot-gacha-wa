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

// Fungsi pembantu untuk membuat kode unik acak
function generateUniqueCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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

// 🎲 ENDPOINT GACHA PUSAT (Rate aman terkunci di server)
app.post('/api/gacha', (req, res) => {
    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ success: false, message: 'Cards database not found' });
    }

    const cardsDB = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    if (!cardsDB.length) {
        return res.status(500).json({ success: false, message: 'Database kartu kosong' });
    }

    // Atur peluang rate bintang di sini (aman dari kecurangan client)
    const rand = Math.random() * 100;
    let targetRarity = 3; // Default Common
    if (rand <= 10) {
        targetRarity = 5;       // 10% Legendary (Bintang 5)
    } else if (rand <= 40) {
        targetRarity = 4;       // 30% Epic (Bintang 4)
    }                           // Sisanya 60% Bintang 3

    // Filter kartu berdasarkan rarity target
    let availableCards = cardsDB.filter(c => (c.rarity || 3) === targetRarity);
    
    // Fallback jika kategori rarity tersebut kosong di JSON
    if (availableCards.length === 0) {
        availableCards = cardsDB;
    }

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    const printNumber = Math.floor(1000 + Math.random() * 9000);
    
    const acquiredCard = {
        cardId: randomCard.id,
        print: printNumber,
        code: generateUniqueCode(6),
        obtainedAt: Date.now()
    };

    res.json({
        success: true,
        card: randomCard,
        acquired: acquiredCard
    });
});

// Endpoint Givecard dengan Validasi Owner Resmi dan Dukungan LID Firebase
app.post('/api/givecard', (req, res) => {
    const { senderNumber, targetUser, cardId } = req.body;
    
    const officialOwnerNumber = "6288808536697"; 
    const officialOwnerLid = "178216010539209";

    const cleanSender = senderNumber ? String(senderNumber).replace(/[^0-9]/g, '') : '';

    if (cleanSender !== officialOwnerNumber && cleanSender !== officialOwnerLid) {
        console.log(`❌ DITOLAK: Nomor/LID ${cleanSender} mencoba memakai givecard tapi bukan owner.`);
        return res.status(403).json({ 
            success: false, 
            message: "❌ Akses ditolak! Perintah ini hanya bisa dipakai oleh Owner bot." 
        });
    }

    console.log(`✅ DITERIMA: Owner sah (${cleanSender}) menjalankan givecard.`);
    res.json({ 
        success: true, 
        message: "✅ Kartu berhasil diberikan oleh Owner!" 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server pusat berjalan di port ${PORT}`);
});
        
