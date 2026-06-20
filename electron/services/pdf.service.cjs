const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

async function generatePdf(html, outputPath) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    if (outputPath) {
        fs.writeFileSync(outputPath, pdfBuffer);
        return outputPath;
    }

    return pdfBuffer;
}

module.exports = { generatePdf };
