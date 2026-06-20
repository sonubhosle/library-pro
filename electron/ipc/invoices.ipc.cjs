const { generateInvoice, getInvoiceById, getAllInvoices, deleteInvoice } = require('../services/invoice.service.cjs');
const { generatePdf } = require('../services/pdf.service.cjs');
const Admin = require('../db/models/Admin.cjs');
const { dialog } = require('electron');
const path = require('path');

function registerInvoicesIpc(ipcMain) {
    ipcMain.handle('invoices:generate', async (event, { data, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const invoice = await generateInvoice(data, adminId, admin.name);
            return { success: true, data: invoice };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('invoices:getAll', async (event, filters) => {
        try {
            const invoices = await getAllInvoices(filters || {});
            return { success: true, data: invoices };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('invoices:getById', async (event, id) => {
        try {
            const invoice = await getInvoiceById(id);
            return { success: true, data: invoice };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('invoices:exportPdf', async (event, { html, fileName }) => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                defaultPath: path.join(process.env.USERPROFILE || '', 'Documents', fileName || 'Invoice.pdf'),
                filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
            });

            if (filePath) {
                await generatePdf(html, filePath);
                return { success: true, path: filePath };
            }
            return { success: false, error: 'Save cancelled' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('invoices:delete', async (event, { id, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            await deleteInvoice(id, adminId, admin.name);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerInvoicesIpc };
