const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, 'assets', 'Roboto-Bold.ttf');
if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'Roboto');
}

const RARITY_CONFIG = {
    5: { color: '#FFD700', label: 'LEGENDARY' },
    4: { color: '#C0C0C0', label: 'EPIC' },
    3: { color: '#CD7F32', label: 'COMMON' }
};

async function renderCard(characterImageUrl, nameText, seriesText, rarity = 3) {
    const canvasWidth = 400;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    const img = await loadImage(characterImageUrl);
    
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;
    let renderWidth, renderHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
        renderHeight = canvasHeight;
        renderWidth = canvasHeight * imgRatio;
        offsetX = (canvasWidth - renderWidth) / 2;
        offsetY = 0;
    } else {
        renderWidth = canvasWidth;
        renderHeight = canvasWidth / imgRatio;
        offsetX = 0;
        offsetY = (canvasHeight - renderHeight) / 2;
    }

    // 1. Gambar Karakter
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

    // 2. Banner Dimmer Bawah
    const bannerGrad = ctx.createLinearGradient(0, 450, 0, canvasHeight);
    bannerGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bannerGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.65)');
    bannerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = bannerGrad;
    ctx.fillRect(0, 450, canvasWidth, 150);

    // 3. Timpa Frame PNG Transparan
    const framePath = path.join(__dirname, 'assets', `frame_${rarity}star.png`);
    const defaultFrame = path.join(__dirname, 'assets', 'frame_5star.png');

    if (fs.existsSync(framePath)) {
        const frameImg = await loadImage(framePath);
        ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
    } else if (fs.existsSync(defaultFrame)) {
        const frameImg = await loadImage(defaultFrame);
        ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
    }

    // 4. Render Teks Nama & Series
    const themeColor = RARITY_CONFIG[rarity]?.color || '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Roboto';
    ctx.fillText(String(nameText || ''), canvasWidth / 2, 530);

    ctx.fillStyle = themeColor;
    ctx.font = '14px Roboto';
    ctx.fillText(String(seriesText || ''), canvasWidth / 2, 558);

    return canvas.toBuffer('image/png');
}

module.exports = { renderCard };
