require('dotenv').config();
const VITE_PORT = process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5175;
if (!globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto;
}
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { initDatabase } = require('./db/db.cjs');
const { seed } = require('./db/seed.cjs');
const { registerIpcHandlers } = require('./ipc/index.cjs');
const { setupAutoUpdater } = require('./services/updater.service.cjs');
const { createLogger } = require('./utils/logger.cjs');
const { autoBackup } = require('./services/backup.service.cjs');

// Global logger
const logger = createLogger('Main');

let mainWindow;
let autoBackupInterval;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: 'LibraryPro',
        backgroundColor: '#0f1117',
        icon: path.join(__dirname, '../assets/icon.png'),
        show: false,
    });

    // Load the app
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    } else {
        mainWindow.loadURL(`http://localhost:${VITE_PORT}`);
    }

    // Retry loading if Vite dev server not ready yet
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${VITE_PORT}`);
      }, 1000);
    });

    // Show window when content is ready
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.show();
    });

    // Initialize Auto-Updater with window reference
    setupAutoUpdater(mainWindow);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

async function init() {
    try {
        logger.info('Initializing Application...');

        // DB Init
        await initDatabase();
        await seed();

        // IPC Registration
        registerIpcHandlers(ipcMain);

        // Perform initial auto-backup on startup
        logger.info('Creating startup backup...');
        await autoBackup();

        createWindow();

        // Setup periodic auto-backup every 30 minutes
        autoBackupInterval = setInterval(async () => {
            logger.info('Running periodic auto-backup...');
            try {
                await autoBackup();
            } catch (error) {
                logger.error('Auto-backup failed:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours (once per day)
    } catch (error) {
        logger.error('Startup Error:', error);
        app.quit();
    }
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
    // Clear auto-backup interval
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
    }
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle crashes - save backup before exiting
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    autoBackup().catch(err => logger.error('Emergency backup failed:', err));
});

app.on('before-quit', async (event) => {
    logger.info('App closing - creating final backup...');
    // Clear interval
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
    }
});
