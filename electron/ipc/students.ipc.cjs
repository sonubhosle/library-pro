const { getAllStudents, createStudent, updateStudent, deleteStudent } = require('../services/students.service.cjs');
const Admin = require('../db/models/Admin.cjs');

function registerStudentsIpc(ipcMain) {
    ipcMain.handle('students:getAll', async (event, filters) => {
        try {
            const students = await getAllStudents(filters);
            return { success: true, data: students };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('students:create', async (event, { data, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const student = await createStudent(data, adminId, admin.name);
            return { success: true, data: student };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('students:update', async (event, { id, data, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            const student = await updateStudent(id, data, adminId, admin.name);
            return { success: true, data: student };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('students:delete', async (event, { id, adminId }) => {
        try {
            const admin = await Admin.findById(adminId);
            if (!admin) throw new Error('Admin not found');

            await deleteStudent(id, adminId, admin.name);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerStudentsIpc };
