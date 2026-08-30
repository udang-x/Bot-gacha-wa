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

const PORT = process.env.PORT || 8080;
const CARDS_PATH = path.join(__dirname, 'cards.json');
const FRAMES_PATH = path.join(__dirname, 'frames.json');
const USERS_PATH = path.join(__dirname, 'users.json');

// Fungsi pembantu untuk membuat kode unik acak
function generateUniqueCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Fungsi pembantu baca/tulis database user lokal di server
function getUsersDB() {
    if (!fs.existsSync(USERS_PATH)) return {};
    try {
        return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    } catch {
        return {};
    }
}

function saveUsersDB(data) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
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

// 🎲 ENDPOINT GACHA PUSAT (Dengan Validasi Limit & Cooldown 15 Menit)
app.post('/api/gacha', (req, res) => {
    const { sender } = req.body;
    if (!sender) {
        return res.status(400).json({ success: false, message: 'Sender tidak valid.' });
    }

    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ success: false, message: 'Cards database not found' });
    }

    const cardsDB = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    if (!cardsDB.length) {
        return res.status(500).json({ success: false, message: 'Database kartu kosong' });
    }

    const users = getUsersDB();
    if (!users[sender]) {
        users[sender] = { limit: 0, lastDaily: 0, lastGacha: 0 };
    }

    const user = users[sender];
    const now = Date.now();

    // Cek Limit Tiket
    if ((user.limit || 0) <= 0) {
        return res.json({ success: false, message: '❌ Tiket gacha kamu habis! Ketik .daily untuk mengambil tiket harian.' });
    }

    // Cek Cooldown 15 Menit
    const cooldownTime = 15 * 60 * 1000;
    if (user.lastGacha && now - user.lastGacha < cooldownTime) {
        const remaining = cooldownTime - (now - user.lastGacha);
        const minutes = Math.floor(remaining / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        return res.json({ success: false, message: `⏳ Kamu masih dalam masa cooldown!\nTunggu ${minutes} menit ${seconds} detik lagi.` });
    }

    const rollCard = () => {
        const randomCard = cardsDB[Math.floor(Math.random() * cardsDB.length)];
        let assignedRarity = 5;

        if (!randomCard.isVideo) {
            const rand = Math.random() * 100;
            if (rand <= 10) {
                assignedRarity = 5;
            } else if (rand <= 40) {
                assignedRarity = 4;
            } else {
                assignedRarity = 3;
            }
        }

        const printNumber = Math.floor(1000 + Math.random() * 9000);
        
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

    const drop1 = rollCard();
    const drop2 = rollCard();

    // Kurangi limit dan update cooldown user di server
    user.limit -= 1;
    user.lastGacha = now;
    users[sender] = user;
    saveUsersDB(users);

    res.json({
        success: true,
        drop1,
        drop2,
        newLimit: user.limit
    });
});

// ⏳ ENDPOINT DAILY CLAIM AMAN
app.post('/api/daily', (req, res) => {
    const { sender } = req.body;
    if (!sender) {
        return res.status(400).json({ success: false, message: 'Sender tidak valid.' });
    }

    const users = getUsersDB();
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 Jam

    if (!users[sender]) {
        users[sender] = { limit: 0, lastDaily: 0, lastGacha: 0 };
    }

    const user = users[sender];
    const timeDiff = now - user.lastDaily;

    if (timeDiff < cooldown) {
        const remainingTime = cooldown - timeDiff;
        const remainingHours = Math.ceil(remainingTime / (1000 * 60 * 60));
        return res.json({ 
            success: false,
            cooldown: true,
            remainingHours,
            message: `⏳ Kamu sudah klaim daily. Coba lagi dalam ${remainingHours} jam.`
        });
    }

    user.limit = (user.limit || 0) + 9;
    user.lastDaily = now;
    users[sender] = user;
    saveUsersDB(users);

    res.json({
        success: true,
        newLimit: user.limit,
        message: `🎁 Daily Claim Berhasil! Kamu mendapat +9 Tiket Gacha.`
    });
});

// 🎁 ENDPOINT GIVECARD AMAN
app.post('/api/givecard', (req, res) => {
    const { senderNumber, targetUser, cardId, ownerToken } = req.body;
    
    const officialOwnerNumber = "6288808536697"; 
    const officialOwnerLid = "178216010539209";

    const cleanSender = senderNumber ? String(senderNumber).replace(/[^0-9]/g, '') : '';

    if ((cleanSender !== officialOwnerNumber && cleanSender !== officialOwnerLid) || ownerToken !== SECRET_OWNER_TOKEN) {
        return res.status(403).json({ 
            success: false, 
            message: "❌ Akses ditolak! Kredensial Owner tidak valid." 
        });
    }

    res.json({ 
        success: true, 
        message: "✅ Kartu berhasil diberikan oleh Owner!" 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server pusat berjalan di port ${PORT}`);
});
