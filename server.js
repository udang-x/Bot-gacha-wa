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

// Endpoint Givecard dengan pembersihan nomor agar kebal device ID
app.post('/api/givecard', (req, res) => {
    const { senderNumber, targetUser, cardId } = req.body;
    
    // Ambil hanya angka murni dari senderNumber yang masuk (mengabaikan @s.whatsapp.net atau :1)
    const cleanSender = senderNumber ? senderNumber.replace(/[^0-9]/g, '') : '';
    
    // Nomor owner murni milikmu (hanya angkanya saja)
    const officialOwnerNumber = "6288808536697"; 

    // Validasi berbasis angka murni
    if (cleanSender !== officialOwnerNumber) {
        return res.status(403).json({ 
            success: false, 
            message: "❌ Akses ditolak! Anda bukan owner bot." 
        });
    }

    res.json({ 
        success: true, 
        message: "✅ Kartu berhasil diberikan oleh Owner!" 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server pusat berjalan di port ${PORT}`);
});
