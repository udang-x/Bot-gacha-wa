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

// Endpoint Givecard dengan Validasi Owner Resmi dan Dukungan LID Firebase
app.post('/api/givecard', (req, res) => {
    const { senderNumber, targetUser, cardId } = req.body;
    
    // Identitas resmi owner (nomor biasa dan LID Firebase)
    const officialOwnerNumber = "6288808536697"; 
    const officialOwnerLid = "178216010539209";

    // Membersihkan nomor pengirim dari simbol atau ekstensi WhatsApp
    const cleanSender = senderNumber ? String(senderNumber).replace(/[^0-9]/g, '') : '';

    // 🛡️ VALIDASI KETAT: Cek apakah cocok dengan nomor atau LID owner
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
