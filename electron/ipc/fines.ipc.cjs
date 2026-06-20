const { getAllFines, collectPayment, waiveFine } = require('../services/fines.service.cjs');
const Admin = require('../db/models/Admin.cjs');

function registerFinesIpc(ipcMain) {
    ipcMain.handle('fines:getAll', async (event, filters) => {
        try {
            const data = await getAllFines(filters);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('fines:collectPayment', async (event, { fineId, amount, adminId, notes }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const fine = await collectPayment(fineId, {
                amount,
                adminId,
                adminName: admin.name,
                notes
            });
            return { success: true, data: fine };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('fines:waive', async (event, { fineId, adminId, notes }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const fine = await waiveFine(fineId, {
                adminId,
                adminName: admin.name,
                notes
            });
            return { success: true, data: fine };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerFinesIpc };
