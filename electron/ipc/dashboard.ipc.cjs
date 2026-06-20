const { getDashboardStats } = require('../services/dashboard.service.cjs');

function registerDashboardIpc(ipcMain) {
    ipcMain.handle('dashboard:getStats', async () => {
        try {
            const data = await getDashboardStats();
            return { success: true, ...data };
        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerDashboardIpc };
