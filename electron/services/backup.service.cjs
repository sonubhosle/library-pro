const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { encryptGCM, decryptGCM } = require('../utils/encryption.cjs');
const { createLogger } = require('../utils/logger.cjs');

const logger = createLogger('Backup');

const Admin = require('../db/models/Admin.cjs');
const Book = require('../db/models/Book.cjs');
const Student = require('../db/models/Student.cjs');
const BookIssue = require('../db/models/BookIssue.cjs');
const Fine = require('../db/models/Fine.cjs');
const Invoice = require('../db/models/Invoice.cjs');
const Setting = require('../db/models/Setting.cjs');

const BACKUP_SECRET = 'library-pro-backup-key-2024';

const MODELS = {
    Admin,
    Book,
    Student,
    BookIssue,
    Fine,
    Invoice,
    Setting
};

// Get backup directory
function getBackupDir() {
    const backupFolder = path.join(app.getPath('documents'), 'LibraryPro', 'Backups');
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }
    return backupFolder;
}

// Get recovery backup directory (auto-backups)
function getRecoveryDir() {
    const recoveryFolder = path.join(app.getPath('userData'), 'recovery');
    if (!fs.existsSync(recoveryFolder)) {
        fs.mkdirSync(recoveryFolder, { recursive: true });
    }
    return recoveryFolder;
}

async function createBackup(customPath, isRecovery = false) {
    try {
        const backupFolder = customPath || (isRecovery ? getRecoveryDir() : getBackupDir());
        
        const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFileName = isRecovery 
            ? `LibraryPro_Recovery_${date}.lbak`
            : `LibraryPro_Backup_${date}.lbak`;
        const backupFilePath = path.join(backupFolder, backupFileName);

        // Fetch all documents from all collections
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            collections: {}
        };
        
        let totalRecords = 0;
        for (const [key, Model] of Object.entries(MODELS)) {
            const docs = await Model.find({});
            backupData.collections[key] = docs;
            totalRecords += docs.length;
        }

        // Encrypt and write to file
        const jsonString = JSON.stringify(backupData);
        const encrypted = encryptGCM(jsonString, BACKUP_SECRET);

        fs.writeFileSync(backupFilePath, encrypted);
        logger.info(`Backup created: ${backupFileName} (${totalRecords} records)`);

        // Clean old recovery backups (keep only last 5)
        if (isRecovery) {
            cleanOldRecoveryBackups();
        }

        return { 
            success: true,
            path: backupFilePath, 
            name: backupFileName,
            size: fs.statSync(backupFilePath).size,
            timestamp: new Date().toISOString(),
            records: totalRecords
        };
    } catch (error) {
        logger.error(`Failed to create backup: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function restoreBackup(filePath) {
    try {
        // Read and decrypt
        const encrypted = fs.readFileSync(filePath, 'utf8');
        const decryptedJson = decryptGCM(encrypted, BACKUP_SECRET);
        const backupData = JSON.parse(decryptedJson);

        logger.info(`Restoring backup from: ${path.basename(filePath)}`);

        // Clear current collections and import restored data
        let totalRestored = 0;
        const collections = backupData.collections || backupData;
        
        for (const [key, Model] of Object.entries(MODELS)) {
            const data = collections[key];
            if (data && Array.isArray(data)) {
                await Model.deleteMany({});
                if (data.length > 0) {
                    await Model.insertMany(data);
                    totalRestored += data.length;
                }
            }
        }

        logger.info(`Backup restored successfully (${totalRestored} records)`);
        return { success: true, restored: totalRestored };
    } catch (error) {
        logger.error(`Failed to restore backup: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// List all backups
function listBackups() {
    try {
        const backupFolder = getBackupDir();
        if (!fs.existsSync(backupFolder)) {
            return { success: true, backups: [] };
        }
        const files = fs.readdirSync(backupFolder)
            .filter(f => f.endsWith('.lbak') && !f.includes('Recovery'))
            .map(f => {
                const filePath = path.join(backupFolder, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtimeMs,
                    date: new Date(stats.birthtimeMs).toLocaleString()
                };
            })
            .sort((a, b) => b.created - a.created);
        
        logger.info(`Listed ${files.length} backups`);
        return { success: true, backups: files };
    } catch (error) {
        logger.error(`Failed to list backups: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// List recovery backups
function listRecoveryBackups() {
    try {
        const recoveryFolder = getRecoveryDir();
        if (!fs.existsSync(recoveryFolder)) {
            return { success: true, backups: [] };
        }
        const files = fs.readdirSync(recoveryFolder)
            .filter(f => f.endsWith('.lbak'))
            .map(f => {
                const filePath = path.join(recoveryFolder, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtimeMs,
                    date: new Date(stats.birthtimeMs).toLocaleString()
                };
            })
            .sort((a, b) => b.created - a.created);
        
        logger.info(`Listed ${files.length} recovery backups`);
        return { success: true, backups: files };
    } catch (error) {
        logger.error(`Failed to list recovery backups: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Delete a backup file
function deleteBackup(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`Backup deleted: ${path.basename(filePath)}`);
            return { success: true };
        }
        return { success: false, error: 'Backup file not found' };
    } catch (error) {
        logger.error(`Failed to delete backup: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Clean old recovery backups (keep last 5)
function cleanOldRecoveryBackups() {
    try {
        const recoveryFolder = getRecoveryDir();
        const files = fs.readdirSync(recoveryFolder)
            .filter(f => f.endsWith('.lbak'))
            .map(f => ({
                name: f,
                path: path.join(recoveryFolder, f),
                time: fs.statSync(path.join(recoveryFolder, f)).birthtimeMs
            }))
            .sort((a, b) => b.time - a.time);

        // Keep only last 5, delete older ones
        if (files.length > 5) {
            files.slice(5).forEach(f => {
                fs.unlinkSync(f.path);
                logger.info(`Cleaned old recovery backup: ${f.name}`);
            });
        }
    } catch (error) {
        logger.error(`Failed to clean recovery backups: ${error.message}`);
    }
}

// Auto backup (called periodically or before crash)
async function autoBackup() {
    return createBackup(null, true);
}

module.exports = { 
    createBackup, 
    restoreBackup, 
    listBackups,
    listRecoveryBackups,
    deleteBackup,
    autoBackup,
    getBackupDir,
    getRecoveryDir
};
