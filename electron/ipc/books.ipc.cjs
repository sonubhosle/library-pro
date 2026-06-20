const { getAllBooks, createBook, updateBook, deleteBook } = require('../services/books.service.cjs');
const Admin = require('../db/models/Admin.cjs');

function registerBooksIpc(ipcMain) {
    // Helper to get admin info from token
    async function getAdminInfo(event) {
        try {
            const authToken = event.sender.session.cookies.get({ url: 'http://localhost' })[0];
            // In real app, decode JWT to get adminId
            // For now, we'll try to get from context or request header
            // This would normally come from authentication middleware
            return { _id: 'admin_id', name: 'Admin' };
        } catch (error) {
            throw new Error('Unauthorized');
        }
    }

    ipcMain.handle('books:getAll', async (event, filters) => {
        try {
            const books = await getAllBooks(filters);
            return { success: true, data: books };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('books:create', async (event, { data, adminId }) => {
    try {
        const admin = await Admin.findById(adminId);
        if (!admin) throw new Error('Admin not found');

        const book = await createBook(data, adminId, admin.name);
        return { success: true, data: book };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

    ipcMain.handle('books:update', async (event, { id, data, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');
            
            const book = await updateBook(id, data, adminId, admin.name);
            return { success: true, data: book };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('books:delete', async (event, { id, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');
            
            await deleteBook(id, adminId, admin.name);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerBooksIpc };
