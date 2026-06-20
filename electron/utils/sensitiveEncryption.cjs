const crypto = require('crypto');
const Store = require('electron-store');

const store = new Store();
const ENCRYPTION_KEY_NAME = 'app_master_key';

// Generate or retrieve master encryption key
function getMasterKey() {
    let key = store.get(ENCRYPTION_KEY_NAME);
    
    if (!key) {
        // Generate a new master key (32 bytes for AES-256)
        key = crypto.randomBytes(32).toString('hex');
        store.set(ENCRYPTION_KEY_NAME, key);
    }
    
    return Buffer.from(key, 'hex');
}

// Encrypt sensitive data
function encryptSensitive(plaintext) {
    if (!plaintext) return null;
    
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
    
    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv + authTag + encrypted (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt sensitive data
function decryptSensitive(ciphertext) {
    if (!ciphertext) return null;
    
    try {
        const masterKey = getMasterKey();
        const parts = ciphertext.split(':');
        
        if (parts.length !== 3) return null;
        
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
}

module.exports = { encryptSensitive, decryptSensitive, getMasterKey };
