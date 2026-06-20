const {
    getOverdueBooks,
    sendOverdueReminder,
    sendAllOverdueReminders,
    sendFineNotification,
    sendInvoiceNotification
} = require('../services/notifications.service.cjs');
const Admin = require('../db/models/Admin.cjs');

function registerNotificationsIpc(ipcMain) {
    // Get all overdue books (preview before sending)
    ipcMain.handle('notifications:getOverdue', async (event) => {
        try {
            const overdue = await getOverdueBooks();
            return { success: true, data: overdue };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Send reminder to one specific student
    ipcMain.handle('notifications:sendOverdueReminder', async (event, { issueId, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const overdueBooks = await getOverdueBooks();
            const issue = overdueBooks.find(i => i._id?.toString() === issueId || i.id === issueId);
            if (!issue) throw new Error('Overdue issue not found');

            const result = await sendOverdueReminder(issue);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Send reminders to ALL overdue students at once
    ipcMain.handle('notifications:sendAllOverdueReminders', async (event, { adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const results = await sendAllOverdueReminders();
            return { success: true, results };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Send fine payment notification
    ipcMain.handle('notifications:sendFineNotification', async (event, { adminId, studentEmail, studentName, fineCode, amount, totalFine, isPaid }) => {
        try {
            const result = await sendFineNotification({ studentEmail, studentName, fineCode, amount, totalFine, isPaid });
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Send invoice notification
    ipcMain.handle('notifications:sendInvoiceNotification', async (event, { adminId, studentEmail, studentName, invoiceNumber, total, invoiceType }) => {
        try {
            const result = await sendInvoiceNotification({ studentEmail, studentName, invoiceNumber, total, invoiceType });
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Get all notifications for a user (admin)
    ipcMain.handle('notifications:getAll', async (event, { adminId }) => {
        try {
            const res = await require('../services/notificationData.service.cjs').getAllNotifications(adminId);
            return { success: true, data: res };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Mark a notification as read
    ipcMain.handle('notifications:markRead', async (event, { id }) => {
        try {
            await require('../services/notificationData.service.cjs').markNotificationRead(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Delete a notification
    ipcMain.handle('notifications:delete', async (event, { id }) => {
        try {
            await require('../services/notificationData.service.cjs').deleteNotification(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerNotificationsIpc };
