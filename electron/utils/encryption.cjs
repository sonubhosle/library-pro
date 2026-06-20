const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const GCM_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function encrypt(text, secretKey) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(secretKey, 'salt', KEY_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text, secretKey) {
    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(secretKey, 'salt', KEY_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function encryptGCM(data, secretKey) {
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(secretKey, 'salt', KEY_LENGTH);
    const cipher = crypto.createCipheriv(GCM_ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptGCM(encryptedData, secretKey) {
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(secretKey, 'salt', KEY_LENGTH);
    const decipher = crypto.createDecipheriv(GCM_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt, encryptGCM, decryptGCM };
