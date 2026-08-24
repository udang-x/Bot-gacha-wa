const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

const BOT_NUMBER = '6288808536697'; 

// Render Kartu Gacha
async function generateCard(charImgPath, name, series) {
    const canvas = createCanvas(400, 600);
    const ctx = canvas.getContext('2d');

    if (fs.existsSync(charImgPath) && fs.existsSync('./assets/frame.png')) {
        const character = await loadImage(charImgPath);
        const frame = await loadImage('./assets/frame.png');
        ctx.drawImage(character, 0, 0, 400, 600);
        ctx.drawImage(frame, 0, 0, 400, 600);
    } else {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, 400, 600);
    }

    ctx.font = 'bold 24px Sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(name, 200, 510);
    
    ctx.font = '16px Sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(series, 200, 540);

    return canvas.toBuffer('image/png');
}

async function startBot() {
    // Sesi baru session_v3 untuk reset pairing state
    const { state, saveCreds } = await useMultiFileAuthState('session_v3');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        // Menyamar sebagai Chrome Desktop agar tidak ditolak server WhatsApp
        browser: Browsers.ubuntu('Chrome') 
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(BOT_NUMBER);
                console.log(`\n===================================`);
                console.log(`KODE PAIRING WA KAMU: ${code}`);
                console.log(`===================================\n`);
            } catch (err) {
                console.log('Gagal meminta kode pairing:', err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ BOT WA GACHA BERHASIL TERHUBUNG!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (text.toLowerCase() === '.gacha') {
            try {
                const db = JSON.parse(fs.readFileSync('./database.json'));
                const randomCard = db.cards[Math.floor(Math.random() * db.cards.length)];
                
                const cardBuffer = await generateCard(randomCard.image, randomCard.name, randomCard.series);

                const sender = msg.key.participant || msg.key.remoteJid;
                if (!db.users[sender]) db.users[sender] = [];
                db.users[sender].push(randomCard.id);
                fs.writeFileSync('./database.json', JSON.stringify(db, null, 2));

                await sock.sendMessage(from, {
                    image: cardBuffer,
                    caption: `🎉 *@${sender.split('@')[0]}* mendapatkan kartu:\n*${randomCard.name}* (${randomCard.series})`,
                    mentions: [sender]
                });
            } catch (e) {
                console.log('Error saat memproses .gacha:', e);
            }
        }
    });
}

startBot();

