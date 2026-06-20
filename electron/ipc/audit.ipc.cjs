const AuditLogger = require('../utils/auditLogger.cjs');
const Admin = require('../db/models/Admin.cjs');

function registerAuditIpc(ipcMain) {
    // Get admin's own audit logs
    ipcMain.handle('audit:getMyLogs', async (event, { adminId, limit = 50 }) => {
        try {
            const logs = await AuditLogger.getAdminLogs(adminId, limit);
            return { success: true, data: logs };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get all audit logs (admin only)
    ipcMain.handle('audit:getAllLogs', async (event, { adminId, filters = {}, limit = 100 }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) {
                throw new Error('Unauthorized access');
            }

            const logs = await AuditLogger.getAllLogs(filters, limit);
            return { success: true, data: logs };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get logs for specific action/entity
    ipcMain.handle('audit:getActionLogs', async (event, { adminId, action, entityType, limit = 50 }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin || admin.role !== 'admin') {
                throw new Error('Unauthorized access');
            }

            const logs = await AuditLogger.getActionLogs(action, entityType, limit);
            return { success: true, data: logs };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerAuditIpc };
