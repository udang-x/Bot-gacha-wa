const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// 🔒 Kunci Rahasia API & Password Khusus Owner
const API_SECRET = "KunciRahasiaBotGacha123";
const SECRET_OWNER_TOKEN = "OwnerSuperSecretPasscode999";

// Middleware Proteksi Header (Menolak request tanpa API Key rahasia)
app.use((req, res, next) => {
    if (req.path === '/') return next(); // Biarkan halaman utama terakses publik
    
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

// 🖼️ ENDPOINT DEDIKASI FRAME (Membaca frames.json)
app.get('/api/frames', (req, res) => {
    if (!fs.existsSync(FRAMES_PATH)) {
        return res.status(404).json({ error: 'Frames database not found on server.' });
    }
    const frames = JSON.parse(fs.readFileSync(FRAMES_PATH, 'utf8'));
    res.json(frames);
});

// 🎲 ENDPOINT GACHA PUSAT (Sistem Akal-Akalan Rarity Dinamis & Drop 2 Pilihan)
app.post('/api/gacha', (req, res) => {
    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ success: false, message: 'Cards database not found' });
    }

    const cardsDB = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    if (!cardsDB.length) {
        return res.status(500).json({ success: false, message: 'Database kartu kosong' });
    }

    const rollCard = () => {
        // 1. Pilih karakter acak dari database
        const randomCard = cardsDB[Math.floor(Math.random() * cardsDB.length)];
        
        // 2. Tentukan Rarity secara dinamis
        let assignedRarity = 5;

        // Jika kartu bukan video (gambar statis), acak bintang 3, 4, atau 5
        if (!randomCard.isVideo) {
            const rand = Math.random() * 100;
            if (rand <= 10) {
                assignedRarity = 5;       // 10% rate bintang 5
            } else if (rand <= 40) {
                assignedRarity = 4;       // 30% rate bintang 4
            } else {
                assignedRarity = 3;       // 60% rate bintang 3
            }
        }

        const printNumber = Math.floor(1000 + Math.random() * 9000);
        
        // Buat objek kartu hasil gabungan dengan rarity dinamis
        const finalCard = {
            ...randomCard,
            rarity: assignedRarity
        };

        return {
            card: finalCard,
            acquired: {
                cardId: randomCard.isVideo ? randomCard.id : `${randomCard.id}_${assignedRarity}`,
                print: printNumber,
                code: generateUniqueCode(6),
                obtainedAt: Date.now()
            }
        };
    };

    // Ambil 2 kartu sekaligus untuk sistem pilihan (drop 2)
    const drop1 = rollCard();
    const drop2 = rollCard();

    res.json({
        success: true,
        choices: [drop1, drop2]
    });
});

// 🎁 ENDPOINT GIVECARD AMAN (Validasi Ganda: Nomor/LID Owner + Passcode Khusus)
app.post('/api/givecard', (req, res) => {
    const { senderNumber, targetUser, cardId, ownerToken } = req.body;
    
    const officialOwnerNumber = "6288808536697"; 
    const officialOwnerLid = "178216010539209";

    const cleanSender = senderNumber ? String(senderNumber).replace(/[^0-9]/g, '') : '';

    if ((cleanSender !== officialOwnerNumber && cleanSender !== officialOwnerLid) || ownerToken !== SECRET_OWNER_TOKEN) {
        console.log(`❌ DITOLAK: Nomor/LID ${cleanSender} atau token tidak valid mencoba memakai givecard.`);
        return res.status(403).json({ 
            success: false, 
            message: "❌ Akses ditolak! Kredensial Owner tidak valid." 
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
