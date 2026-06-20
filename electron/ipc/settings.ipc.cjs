const Setting = require('../db/models/Setting.cjs');
const { encryptSensitive, decryptSensitive } = require('../utils/sensitiveEncryption.cjs');

const ENCRYPTED_FIELDS = ['smtp_pass'];

function registerSettingsIpc(ipcMain) {
    ipcMain.handle('settings:getAll', async () => {
        try {
            const results = await Setting.find({});
            const settingsMap = {};
            results.forEach(r => {
                // Decrypt sensitive fields before returning
                if (ENCRYPTED_FIELDS.includes(r.key) && r.value) {
                    settingsMap[r.key] = decryptSensitive(r.value) || r.value;
                } else {
                    settingsMap[r.key] = r.value;
                }
            });
            return { success: true, data: settingsMap };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('settings:update', async (event, data) => {
        try {
            for (const [key, value] of Object.entries(data)) {
                // Encrypt sensitive fields before storing
                let storedValue = String(value);
                if (ENCRYPTED_FIELDS.includes(key) && value) {
                    storedValue = encryptSensitive(value);
                }
                
                await Setting.findOneAndUpdate(
                    { key },
                    { value: storedValue },
                    { upsert: true, returnDocument: 'after' }
                );
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerSettingsIpc };
