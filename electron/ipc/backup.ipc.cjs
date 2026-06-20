const { createBackup, restoreBackup, listBackups, listRecoveryBackups, deleteBackup, autoBackup } = require('../services/backup.service.cjs');
const { dialog } = require('electron');

function registerBackupIpc(ipcMain) {
    ipcMain.handle('backup:create', async (event, customPath) => {
        try {
            const result = await createBackup(customPath, false);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('backup:restore', async (event, filePath) => {
        try {
            if (filePath) {
                // Direct restore with file path
                const result = await restoreBackup(filePath);
                return result;
            } else {
                // Show file picker
                const { filePaths } = await dialog.showOpenDialog({
                    filters: [{ name: 'LibraryPro Backup', extensions: ['lbak'] }],
                    properties: ['openFile']
                });

                if (filePaths && filePaths[0]) {
                    const result = await restoreBackup(filePaths[0]);
                    return result;
                }
                return { success: false, error: 'No file selected' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('backup:list', async (event) => {
        try {
            return listBackups();
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('backup:listRecovery', async (event) => {
        try {
            return listRecoveryBackups();
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('backup:delete', async (event, filePath) => {
        try {
            return deleteBackup(filePath);
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('backup:auto', async (event) => {
        try {
            const result = await autoBackup();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerBackupIpc };
