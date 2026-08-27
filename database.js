const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');

// Konfigurasi Web SDK dari Firebase Project Kamu
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

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function sanitizeKey(jid) {
    return jid.replace(/[^a-zA-Z0-9]/g, '_');
}

async function getUserData(userId) {
    const cleanId = sanitizeKey(userId);
    const userRef = ref(db, 'users/' + cleanId);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
        const data = snapshot.val();
        if (!data.cards) data.cards = [];
        return data;
    } else {
        const newUser = { limit: 5, lastDaily: 0, cards: [] };
        await set(userRef, newUser);
        return newUser;
    }
}

async function updateUserData(userId, data) {
    const cleanId = sanitizeKey(userId);
    const userRef = ref(db, 'users/' + cleanId);
    await set(userRef, data);
}

module.exports = { getUserData, updateUserData };
