// electron/services/reports.service.cjs

const ExcelJS = require('exceljs');
const { generatePdf } = require('./pdf.service.cjs'); // reuse PDF generation
const path = require('path');
const fs = require('fs');

/**
 * Generate an Excel report for the given data and save to filePath.
 * @param {Array<Object>} data - Array of row objects.
 * @param {string} filePath - Destination .xlsx file path.
 */
async function generateExcelReport(data, filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data provided for Excel report');
    }
    // Use keys of first object as columns
    const columns = Object.keys(data[0]).map(key => ({ header: key, key }));
    worksheet.columns = columns;
    data.forEach(row => worksheet.addRow(row));
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

/**
 * Generate a CSV report for the given data and save to filePath.
 */
async function generateCsvReport(data, filePath) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data provided for CSV report');
    }
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    await fs.promises.writeFile(filePath, csvContent, 'utf8');
    return filePath;
}

/**
 * Generate a PDF report using existing PDF service.
 * The `html` argument should be a complete HTML string.
 */
async function generatePdfReport(html, filePath) {
    return await generatePdf(html, filePath);
}

module.exports = {
    generateExcelReport,
    generateCsvReport,
    generatePdfReport,
};
