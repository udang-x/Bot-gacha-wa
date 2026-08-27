app.post('/api/givecard', (req, res) => {
    const { senderNumber, targetUser, cardId } = req.body;
    
    const cleanSender = senderNumber ? String(senderNumber).replace(/[^0-9]/g, '') : '';
    const officialOwnerNumber = "6288808536697"; 

    if (cleanSender !== officialOwnerNumber) {
        // Balas langsung nomor yang terbaca ke chat WhatsApp untuk kita intip
        return res.status(403).json({ 
            success: false, 
            message: `❌ Ditolak! Nomor kamu terbaca: "${cleanSender}", tapi owner diset: "${officialOwnerNumber}"` 
        });
    }

    res.json({ 
        success: true, 
        message: "✅ Kartu berhasil diberikan oleh Owner!" 
    });
});
