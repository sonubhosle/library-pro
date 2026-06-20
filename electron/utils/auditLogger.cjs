const AuditLog = require('../db/models/AuditLog.cjs');
const { logger } = require('./logger.cjs');

class AuditLogger {
    static async log({
        adminId,
        adminName,
        action, // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT
        entityType, // Book, Student, Issue, Fine, Invoice, Admin, Auth
        entityId = null,
        changes = null,
        ipAddress = null,
        status = 'SUCCESS',
        errorMessage = null,
        details = null
    }) {
        try {
            await AuditLog.create({
                adminId,
                adminName,
                action,
                entityType,
                entityId,
                changes,
                ipAddress,
                status,
                errorMessage,
                details,
                timestamp: new Date()
            });

            logger.info(`[AUDIT] ${action} on ${entityType} by ${adminName}`);
        } catch (error) {
            logger.error(`Failed to create audit log: ${error.message}`);
        }
    }

    static async getAdminLogs(adminId, limit = 100) {
        try {
            return await AuditLog.find({ adminId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .select('-__v');
        } catch (error) {
            logger.error(`Failed to fetch audit logs: ${error.message}`);
            return [];
        }
    }

    static async getAllLogs(filters = {}, limit = 100) {
        try {
            const logs = await AuditLog.find(filters)
                .sort({ timestamp: -1 })
                .limit(limit)
                .select('-__v')
                .lean();

            // Convert ObjectId fields to strings for IPC serialization
            return logs.map(log => ({
                ...log,
                _id: log._id?.toString(),
                adminId: log.adminId?.toString(),
                entityId: log.entityId?.toString() || null,
            }));
        } catch (error) {
            logger.error(`Failed to fetch audit logs: ${error.message}`);
            return [];
        }
    }

    static async getActionLogs(action, entityType, limit = 100) {
        try {
            return await AuditLog.find({ action, entityType })
                .sort({ timestamp: -1 })
                .limit(limit)
                .select('-__v');
        } catch (error) {
            logger.error(`Failed to fetch audit logs: ${error.message}`);
            return [];
        }
    }

    static async deleteOldLogs(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await AuditLog.deleteMany({ timestamp: { $lt: cutoffDate } });
            logger.info(`Deleted ${result.deletedCount} old audit logs`);
            return result.deletedCount;
        } catch (error) {
            logger.error(`Failed to delete old audit logs: ${error.message}`);
        }
    }
}

module.exports = AuditLogger;
