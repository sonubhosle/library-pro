const { issueBook, returnBook, markAsLost, getAllIssues } = require('../services/issues.service.cjs');
const Admin = require('../db/models/Admin.cjs');

function registerIssuesIpc(ipcMain) {
    ipcMain.handle('issues:getAll', async (event, filters) => {
        try {
            const result = await getAllIssues(filters);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('issues:create', async (event, { data, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const result = await issueBook(data, adminId, admin.name);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('issues:return', async (event, { issueId, data, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const result = await returnBook(issueId, data, adminId, admin.name);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('issues:markLost', async (event, { issueId, data, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const result = await markAsLost(issueId, data, adminId, admin.name);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerIssuesIpc };
