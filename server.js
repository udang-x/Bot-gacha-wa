const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Inisialisasi Firebase Admin dengan kredensial langsung dan URL region asia-southeast1
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "bot-wa-74e7c",
    privateKeyId: "40c1533d32d3aa5268a54648e4ad7fe73232529e",
    privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCh3IJlhUQbNChd\nisF4+2jd8lYK9wvUtGdBkdxzV7d9fKD3NPlEZiWADa0uvOWGxxmMuJwa5jEFgj92\nYaB/XkSi+gxlD9D9PRsexbOmgLscWMqSLWwFC6ARJoC8TFNlwiWdg5RcQXMLF1JN\nmYcYb0lmocU0sVCqSnSlBGjl0eIxzZv+UmDT1jTMEy8lHhhK1RBxj7tJ1TdFK22t\noluPDEDt+JIB0/t/RURY/xsyYoBIdyiFJRVvMf3Bava6Qol5R1euhw/tW+Sjdl2N\nCyYv++eVPpLU+hPt+TagIPA5eCUZf5aMN8lmqiid8ZS3LNgRFJTYH9icHFfd8viM\nTn4NFwBvAgMBAAECggEALVC7AQkqZCNaGbY7LE/WsCykgjVgDpDjR6w6d+Ba8rrt\npcgi8U9XuF4b2jXwXKdpM8iLi8xedRheBBqZAI+3z5kJ11FyRTPSX+8huL/ZoroJ\nHJuy3ka+7Y5GBHGp95c/SLYJ1zpLpxNEa41MET824ZDw0SvDVam6tmhhpdX46dAg\niOTyMB2Aru77ak63y+vUihm9/PQf3tRwiW06rVZKPmBGOBBCKc62T+fvlxYlPk8w\nRdFH8riNTgZo4YvMPl7PLAQiHG8lv8b3+1q+5Yn1vTv5MC6HC23CMyxr8vKSRhWS\nuHK5dUqCOKast8Irq2q2PUOsTKN/UonGB2ezdPHPIQKBgQDTTPEUIGg4ofsObddT\nfGBpmgEhdk68g8xfmAAVoTauSyVF+8d3VXqeXtAi1R4Gds4eWqJthXuhsCG33Oyf\npC51ao6in4khT8UdWul7549uHQUJ/fGRkLiKATQkkpHKEmae25l8ED8MNlV48F1h\FyyTPY8MqVhV8kLX6Y+R1RyxHQKBgQDEGiufkFRbbQPWBje5/5LWpOfW9NB40Qyw\nPfW1H1L7xch2J8eBEJvvDT01bxo5IQQV30HHuXxRJg0nUD0b3Rda/6s2UsXXJ4ln\n5mpMWdMQKud1zn+QAql2apgzMCgxuCDv53WXD+5TqxJLdco6Ane/3Cve3Q718u2Q\n9vBUkvxt+wKBgC4GTWCn6mujhK7Q6B0MM2ftHp/uSBoxzxtnXWVYtzNhtN24iOsK\nWGoUlttvdlnMGPttnIGkmJhQaBfHbFcdiO0UZ7suas0xteq9+at+dbRzZ7yUbsDZ\OAj/WB87Obw9I9MoXBc05ra/QwDTwlM6m//6YaVNYate2IZ1HkuSkuxVAoGAcALq\ny/eq15YLTOK8TfeXrhb/fh7UPU5bSwf5Iv3DbqBogmTyZdxQ1Vjgj3boqZ0cMkoV\nzrk6Mzfi54PDg/jjcEz9RMg+zUh+CeTo7reYAXIgR4AuCNocZdE5InPtYYjk92Nk\nHWcyIIRkrMmZO01RjTt7q47lDsM1w0npuMVEfqUCgYEAl4sYMIpKQtCZcxHmYkrd\nuJwqHPS4CrpLPWTcfP9W+b5LpeTUj9lhJJO0HLsVBahVUkz9hmgLBahVPA3tPGLq\ni+LUHW9TVNiGqi78VUBHQhZ2t9TfFqLum4Ezu6cO4FI92ICUGRuruwD+YOwJ+JBN\nzY9KQzu1veZ8q9KmASSO09A=\n-----END PRIVATE KEY-----`,
    clientEmail: "firebase-adminsdk-fbsvc@bot-wa-74e7c.iam.gserviceaccount.com"
  }),
  databaseURL: "https://bot-wa-74e7c-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

const app = express();
app.use(express.json());
app.use(cors());

// 🔒 Kunci Rahasia API & Password Khusus Owner
const API_SECRET = "KunciRahasiaBotGacha123";
const SECRET_OWNER_TOKEN = "OwnerSuperSecretPasscode999";

// Middleware Proteksi Header API Key
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

// Fungsi pembantu untuk membuat kode unik acak
function generateUniqueCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper untuk ambil/buat data user di Firebase
async function getFirebaseUser(sender) {
    const ref = db.ref(`users/${sender}`);
    const snapshot = await ref.once('value');
    let userData = snapshot.val();
    
    if (!userData) {
        userData = { limit: 5, lastDaily: 0, lastGacha: 0, cards: [], coin: 0, script: 0 };
        await ref.set(userData);
    }
    if (!Array.isArray(userData.cards)) {
        userData.cards = [];
    }
    return userData;
}

async function saveFirebaseUser(sender, userData) {
    const ref = db.ref(`users/${sender}`);
    await ref.set(userData);
}

app.get('/', (req, res) => {
    res.json({ status: 'Gacha Backend Server with Firebase is Running!' });
});

app.get('/api/cards', (req, res) => {
    if (!fs.existsSync(CARDS_PATH)) {
        return res.status(404).json({ error: 'Cards database not found on server.' });
    }
    const cards = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf8'));
    res.json(cards);
});

app.get('/api/frames', (req, res) => {
    if (!fs.existsSync(FRAMES_PATH)) {
        return res.status(404).json({ error: 'Frames database not found on server.' });
    }
    const frames = JSON.parse(fs.readFileSync(FRAMES_PATH, 'utf8'));
    
    // Pemetaan frame ruby untuk rarity 'L'
    const responseFrames = {
        ...frames,
        'L': frames.ruby || `${req.protocol}://${req.get('host')}/assets/frame_ruby.png`,
        'ruby': frames.ruby || `${req.protocol}://${req.get('host')}/assets/frame_ruby.png`
    };

    res.json(responseFrames);
});

// 🎲 ENDPOINT GACHA PUSAT (Cooldown 20 Menit)
app.post('/api/gacha', async (req, res) => {
    try {
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

        const user = await getFirebaseUser(sender);
        const now = Date.now();
        const gachaCooldown = 20 * 60 * 1000; // Cooldown Gacha 20 Menit

        // Cek Cooldown Gacha 20 Menit
        if (user.lastGacha && now - user.lastGacha < gachaCooldown) {
            const remainingTime = gachaCooldown - (now - user.lastGacha);
            const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
            return res.json({ 
                success: false, 
                cooldown: true,
                remainingMinutes,
                message: `⏳ Cooldown gacha! Coba lagi dalam ${remainingMinutes} menit.` 
            });
        }

        // Cek Limit Tiket
        if ((user.limit || 0) <= 0) {
            return res.json({ success: false, message: '❌ Tiket gacha kamu habis! Ketik .daily untuk mengambil tiket harian.' });
        }

        const rollCard = () => {
            const videoCards = cardsDB.filter(c => c.isVideo === true);
            const imageCards = cardsDB.filter(c => !c.isVideo);

            let randomCard;
            let assignedRarity;

            const isVideoDrop = videoCards.length > 0 && Math.random() < 0.15; 

            if (isVideoDrop) {
                randomCard = videoCards[Math.floor(Math.random() * videoCards.length)];
                assignedRarity = randomCard.rarity || "L"; 
            } else {
                const rand = Math.random() * 100;
                if (rand <= 2) {
                    assignedRarity = 'L'; 
                } else if (rand <= 12) {
                    assignedRarity = 5;  
                } else if (rand <= 42) {
                    assignedRarity = 4;  
                } else {
                    assignedRarity = 3;  
                }

                const fallbackPool = imageCards.length > 0 ? imageCards : cardsDB;
                randomCard = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
            }

            const printNumber = Math.floor(1000 + Math.random() * 9000);
            
            const finalCard = {
                ...randomCard,
                rarity: assignedRarity
            };

            return {
                card: finalCard,
                acquired: {
                    cardId: `${randomCard.id}_R${assignedRarity}_P${printNumber}`,
                    print: printNumber,
                    code: generateUniqueCode(8),
                    obtainedAt: Date.now()
                }
            };
        };

        const drop1 = rollCard();
        const drop2 = rollCard();

        user.limit -= 1;
        user.lastGacha = now;
        await saveFirebaseUser(sender, user);

        res.json({
            success: true,
            drop1,
            drop2,
            newLimit: user.limit
        });
    } catch (error) {
        console.error("Gacha error:", error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server pusat.' });
    }
});

// 📥 ENDPOINT CLAIM KARTU PILIHAN KE FIREBASE
app.post('/api/claim', async (req, res) => {
    try {
        const { sender, acquiredCard } = req.body;
        if (!sender || !acquiredCard) {
            return res.status(400).json({ success: false, message: 'Data claim tidak valid.' });
        }

        const user = await getFirebaseUser(sender);
        user.cards.push(acquiredCard);
        await saveFirebaseUser(sender, user);

        res.json({
            success: true,
            message: 'Kartu berhasil disimpan ke inventaris Firebase!'
        });
    } catch (error) {
        console.error("Claim error:", error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan kartu ke database.' });
    }
});

// ⏳ ENDPOINT DAILY CLAIM (Cooldown 24 Jam)
app.post('/api/daily', async (req, res) => {
    try {
        const { sender } = req.body;
        if (!sender) {
            return res.status(400).json({ success: false, message: 'Sender tidak valid.' });
        }

        const user = await getFirebaseUser(sender);
        const now = Date.now();
        const dailyCooldown = 24 * 60 * 60 * 1000; // Cooldown Daily 24 Jam

        if (user.lastDaily && now - user.lastDaily < dailyCooldown) {
            const remainingTime = dailyCooldown - (now - user.lastDaily);
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
        await saveFirebaseUser(sender, user);

        res.json({
            success: true,
            newLimit: user.limit,
            message: `🎁 Daily Claim Berhasil! Kamu mendapat +9 Tiket Gacha.`
        });
    } catch (error) {
        console.error("Daily error:", error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

// 🧭 ENDPOINT EKSPEDISI CLAIM (Coin & Script)
app.post('/api/expedition/claim', async (req, res) => {
    try {
        const { sender, earnedCoins, earnedScripts } = req.body;
        if (!sender) {
            return res.status(400).json({ success: false, message: 'Sender tidak valid.' });
        }

        const user = await getFirebaseUser(sender);
        
        user.coin = (user.coin || 0) + (earnedCoins || 0);
        user.script = (user.script || 0) + (earnedScripts || 0);
        
        await saveFirebaseUser(sender, user);

        res.json({
            success: true,
            coin: user.coin,
            script: user.script,
            message: 'Hasil ekspedisi berhasil diamankan ke brankas.'
        });
    } catch (error) {
        console.error("Expedition claim error:", error);
        res.status(500).json({ success: false, message: 'Gagal memproses klaim ekspedisi.' });
    }
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
    console.log(`🚀 Server pusat Railway + Firebase berjalan di port ${PORT}`);
});
