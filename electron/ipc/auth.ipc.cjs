const { registerAdmin, loginAdmin, getCurrentUser, logout, changePassword } = require('../services/auth.service.cjs');

function registerAuthIpc(ipcMain) {
    ipcMain.handle('auth:register', async (event, data) => {
        try {
            const result = await registerAdmin(data);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:login', async (event, { email, password }) => {
        try {
            const result = await loginAdmin(email, password);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:getCurrentUser', async () => {
        try {
            const user = await getCurrentUser();
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:logout', async () => {
        try {
            await logout();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:changePassword', async (event, { adminId, currentPassword, newPassword }) => {
        try {
            const result = await changePassword(adminId, currentPassword, newPassword);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerAuthIpc };
