const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');

const app = express();
app.use(express.json());
app.use(cors());

// 🔒 Kunci Rahasia API & Password Khusus Owner
const API_SECRET = "KunciRahasiaBotGacha123";
const SECRET_OWNER_TOKEN = "OwnerSuperSecretPasscode999";

// Konfigurasi Firebase Server
const firebaseConfig = {
    apiKey: "AIzaSyAtQKaaR8Lkwt-tzUyva5FJ0tKUEe3I3ak",
    authDomain: "bot-wa-74e7c.firebaseapp.com",
    databaseURL: "https://bot-wa-74e7c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bot-wa-74e7c",
    storageBucket: "bot-wa-74e7c.firebasestorage.app",
    messagingSenderId: "122904330675",
    appId: "1:122904330675:web:b29d5560491e07d4630bc6",
    measurementId: "G-69QZNB30BY"
};

const appFb = initializeApp(firebaseConfig);
const db = getDatabase(appFb);

function sanitizeKey(jid) {
    return jid ? String(jid).replace(/[^a-zA-Z0-9]/g, '_') : 'unknown';
}

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

// 👤 ENDPOINT AMBIL DATA USER (Jembatan Database Bot Lokal)
app.post('/api/user', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID diperlukan!' });

    const cleanId = sanitizeKey(userId);
    const userRef = ref(db, 'users/' + cleanId);
    const snapshot = await get(userRef);

    let userData = snapshot.exists() ? snapshot.val() : { limit: 5, lastDaily: 0, lastGacha: 0, cards: [] };
    if (!userData.cards) userData.cards = [];
    if (userData.lastGacha === undefined) userData.lastGacha = 0;
    if (userData.limit === undefined) userData.limit = 5;

    res.json({ success: true, user: userData });
});

// 🔄 ENDPOINT UPDATE DATA USER (Jembatan Database Bot Lokal)
app.post('/api/user/update', async (req, res) => {
    const { userId, data } = req.body;
    if (!userId || !data) return res.status(400).json({ success: false, message: 'Data tidak lengkap!' });

    const cleanId = sanitizeKey(userId);
    const userRef = ref(db, 'users/' + cleanId);
    await set(userRef, data);

    res.json({ success: true, message: 'Data user berhasil diperbarui!' });
});

// 🎲 ENDPOINT GACHA PUSAT (VALIDASI LIMIT, COOLDOWN 2 JAM, & FIREBASE SERVER)
app.post('/api/gacha', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID diperlukan!' });
    }

    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ success: false, message: 'Cards database not found' });
    }

    const cardsDB = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    if (!cardsDB.length) {
        return res.status(500).json({ success: false, message: 'Database kartu kosong' });
    }

    // --- TARIK DATA & CEK STATUS USER KE FIREBASE ---
    const cleanId = sanitizeKey(userId);
    const userRef = ref(db, 'users/' + cleanId);
    const snapshot = await get(userRef);
    
    let userData = snapshot.exists() ? snapshot.val() : { limit: 5, lastDaily: 0, lastGacha: 0, cards: [] };
    if (userData.lastGacha === undefined) userData.lastGacha = 0;
    if (userData.limit === undefined) userData.limit = 5;

    // 1. Validasi Tiket Habis
    if (userData.limit <= 0) {
        return res.status(400).json({
            success: false,
            message: '❌ Tiket habis! Ketik `.daily` untuk klaim tiket harian.'
        });
    }

    // 2. Validasi Cooldown 2 Jam
    const cooldownTime = 2 * 60 * 60 * 1000; // 2 Jam dalam milidetik
    const now = Date.now();

    if (now - userData.lastGacha < cooldownTime) {
        const timeLeft = (userData.lastGacha + cooldownTime) - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        return res.status(429).json({
            success: false,
            cooldown: true,
            message: `⏳ Kamu masih dalam masa cooldown! Tunggu ${hours} jam ${minutes} menit ${seconds} detik lagi.`
        });
    }

    // --- KUNCI COOLDOWN & KURANGI TIKET DI SERVER SEBELUM GACHA DIKERJAKAN ---
    userData.lastGacha = now;
    userData.limit -= 1;
    await set(userRef, userData);

    const rollCard = () => {
        const randomCard = cardsDB[Math.floor(Math.random() * cardsDB.length)];
        let assignedRarity = 5;

        if (!randomCard.isVideo) {
            const rand = Math.random() * 100;
            if (rand <= 10) assignedRarity = 5;
            else if (rand <= 40) assignedRarity = 4;
            else assignedRarity = 3;
        }

        const printNumber = Math.floor(1000 + Math.random() * 9000);
        const finalCard = { ...randomCard, rarity: assignedRarity };

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
         
