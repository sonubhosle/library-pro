const { webcrypto } = require('crypto');
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}
const mongoose = require('mongoose');

let isConnected = false;

async function initDatabase() {
    if (isConnected) return mongoose.connection;
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/librarypro';
    try {
        await mongoose.connect(uri);
        isConnected = true;
        console.log('MongoDB connected successfully to:', uri);
        return mongoose.connection;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

function getDb() {
    return mongoose.connection;
}

module.exports = { initDatabase, getDb };
