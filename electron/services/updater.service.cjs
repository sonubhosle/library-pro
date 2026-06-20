const { autoUpdater } = require('electron-updater');
const { createLogger } = require('../utils/logger.cjs');
const { ipcMain } = require('electron');
const logger = createLogger('Updater');

// Track update history
let updateHistory = [];

function setupAutoUpdater(mainWindow) {
    autoUpdater.logger = logger;

    // Auto download updates
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
        logger.info('Checking for update...');
        mainWindow.webContents.send('update:status', 'Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
        logger.info('Update available:', info);
        // Add to history
        updateHistory.push({
            timestamp: new Date().toISOString(),
            version: info.version,
            releaseDate: info.releaseDate,
            status: 'Available',
            changelog: info.releaseName || 'No changelog available'
        });
        mainWindow.webContents.send('update:available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
        logger.info('Update not available.');
        mainWindow.webContents.send('update:status', 'Application is up to date.');
    });

    autoUpdater.on('error', (err) => {
        logger.error('Error in auto-updater: ' + err);
        mainWindow.webContents.send('update:error', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        logger.info(log_message);
        mainWindow.webContents.send('update:progress', progressObj.percent);
    });

    autoUpdater.on('update-downloaded', (info) => {
        logger.info('Update downloaded');
        // Update history status
        const lastEntry = updateHistory[updateHistory.length - 1];
        if (lastEntry) {
            lastEntry.status = 'Downloaded & Ready to Install';
        }
        mainWindow.webContents.send('update:downloaded', info);
    });

    // Check for updates every 2 hours
    setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 1000 * 60 * 60 * 2);

    // Initial check after 5 seconds
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 5000);

    // Register IPC handlers
    ipcMain.handle('update:install', () => {
        autoUpdater.quitAndInstall();
    });

    ipcMain.handle('update:check', async () => {
        try {
            const result = await autoUpdater.checkForUpdatesAndNotify();
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('update:history', () => {
        return { success: true, history: updateHistory };
    });
}

function checkForUpdates() {
    return autoUpdater.checkForUpdatesAndNotify();
}

module.exports = { setupAutoUpdater, checkForUpdates };
