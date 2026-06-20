const { registerAuthIpc } = require('./auth.ipc.cjs');
const { registerBooksIpc } = require('./books.ipc.cjs');
const { registerStudentsIpc } = require('./students.ipc.cjs');
const { registerIssuesIpc } = require('./issues.ipc.cjs');
const { registerFinesIpc } = require('./fines.ipc.cjs');
const { registerInvoicesIpc } = require('./invoices.ipc.cjs');
const { registerReportsIpc } = require('./reports.ipc.cjs');
const { registerBackupIpc } = require('./backup.ipc.cjs');
const { registerSettingsIpc } = require('./settings.ipc.cjs');
const { registerEmailIpc } = require('./email.ipc.cjs');
const { registerDashboardIpc } = require('./dashboard.ipc.cjs');
const { registerAuditIpc } = require('./audit.ipc.cjs');
const { registerNotificationsIpc } = require('./notifications.ipc.cjs');

function registerIpcHandlers(ipcMain) {
    registerAuthIpc(ipcMain);
    registerBooksIpc(ipcMain);
    registerStudentsIpc(ipcMain);
    registerIssuesIpc(ipcMain);
    registerFinesIpc(ipcMain);
    registerInvoicesIpc(ipcMain);
    registerReportsIpc(ipcMain);
    registerBackupIpc(ipcMain);
    registerSettingsIpc(ipcMain);
    registerEmailIpc(ipcMain);
    registerDashboardIpc(ipcMain);
    registerAuditIpc(ipcMain);
    registerNotificationsIpc(ipcMain);
}

module.exports = { registerIpcHandlers };
