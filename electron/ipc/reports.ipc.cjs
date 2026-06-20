// electron/ipc/reports.ipc.cjs

const ExcelJS = require('exceljs');
const { dialog } = require('electron');
const path = require('path');
const { generateCsvReport, generatePdfReport } = require('../services/reports.service.cjs');

function registerReportsIpc(ipcMain) {
    // Excel export
    ipcMain.handle('reports:exportExcel', async (event, { data, columns, fileName, title }) => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                defaultPath: path.join(process.env.USERPROFILE || '', 'Documents', fileName || 'Report.xlsx'),
                filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
            });
            if (!filePath) return { success: false, error: 'Cancelled' };

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            worksheet.mergeCells('A1:E1');
            worksheet.getCell('A1').value = title || 'LibraryPro Report';
            worksheet.getCell('A1').font = { bold: true, size: 16 };
            worksheet.getCell('A1').alignment = { horizontal: 'center' };

            worksheet.getRow(3).values = columns.map(c => c.header);
            worksheet.getRow(3).font = { bold: true };

            data.forEach(item => {
                const row = columns.map(c => item[c.key]);
                worksheet.addRow(row);
            });

            await workbook.xlsx.writeFile(filePath);
            return { success: true, path: filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // CSV export
    ipcMain.handle('reports:exportCsv', async (event, { data, fileName }) => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                defaultPath: path.join(process.env.USERPROFILE || '', 'Documents', fileName || 'Report.csv'),
                filters: [{ name: 'CSV Files', extensions: ['csv'] }]
            });
            if (!filePath) return { success: false, error: 'Cancelled' };

            await generateCsvReport(data, filePath);
            return { success: true, path: filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // PDF export
    ipcMain.handle('reports:exportPdf', async (event, { html, fileName }) => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                defaultPath: path.join(process.env.USERPROFILE || '', 'Documents', fileName || 'Report.pdf'),
                filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
            });
            if (!filePath) return { success: false, error: 'Cancelled' };

            await generatePdfReport(html, filePath);
            return { success: true, path: filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerReportsIpc };
