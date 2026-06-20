const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    adminName: { type: String, required: true },
    action: { type: String, enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'], required: true },
    entityType: { type: String, enum: ['Book', 'Student', 'Issue', 'Fine', 'Invoice', 'Admin', 'Auth'], required: true },
    entityId: mongoose.Schema.Types.ObjectId,
    changes: mongoose.Schema.Types.Mixed, // Store what was changed
    ipAddress: String,
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    errorMessage: String,
    timestamp: { type: Date, default: Date.now },
    details: String // Additional context
});

// Add index for quick queries
AuditLogSchema.index({ adminId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, entityType: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
