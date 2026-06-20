const { sendEmail, testEmail } = require('../services/email.service.cjs');

function registerEmailIpc(ipcMain) {
    ipcMain.handle('email:send', async (event, data) => {
        try {
            await sendEmail(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('email:test', async (event, config) => {
        try {
            await testEmail(config);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerEmailIpc };
