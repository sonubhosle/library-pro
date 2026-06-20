const Fine = require('../db/models/Fine.cjs');
const { validate } = require('../utils/validation.cjs');
const AuditLogger = require('../utils/auditLogger.cjs');

async function getAllFines(filters = {}) {
    const conditions = {};
    if (filters?.status && filters.status !== 'All') {
        conditions.is_paid = filters.status === 'Paid' ? 1 : 0;
    }

    const results = await Fine.find(conditions)
        .populate('student_id')
        .sort({ created_at: -1 });

    return results.map(doc => {
        const fineObj = doc.toObject({ virtuals: true });
        return {
            fine: fineObj,
            student: doc.student_id ? doc.student_id.toObject({ virtuals: true }) : null
        };
    });
}

async function collectPayment(fineId, { amount, adminId, adminName, notes }) {
    try {
        const fine = await Fine.findById(fineId);
        if (!fine) throw new Error('Fine record not found');

        // Validate payment data
        validate('finePayment', { amount, adminId, adminName, notes });
        const newPaidAmount = (fine.paid_amount || 0) + Number(amount);
        if (newPaidAmount > fine.total_fine) {
            throw new Error('Payment exceeds outstanding fine');
        }
        const isPaid = newPaidAmount >= fine.total_fine ? 1 : 0;

        const updatedFine = await Fine.findByIdAndUpdate(fineId, {
            paid_amount: newPaidAmount,
            is_paid: isPaid,
            paid_at: Math.floor(Date.now() / 1000),
            collected_by: adminId,
            notes: notes,
            updated_at: Math.floor(Date.now() / 1000)
        }, { returnDocument: 'after' });

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Fine',
            entityId: fineId,
            changes: {
                fine_code: fine.fine_code,
                amount_collected: amount,
                total_paid: newPaidAmount,
                fully_paid: isPaid === 1
            },
            status: 'SUCCESS'
        });

        return updatedFine.toObject({ virtuals: true });
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Fine',
            entityId: fineId,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function waiveFine(fineId, { adminId, adminName, notes }) {
    try {
        const fine = await Fine.findById(fineId);
        if (!fine) throw new Error('Fine record not found');

        const updatedFine = await Fine.findByIdAndUpdate(fineId, {
            is_paid: 1,
            paid_amount: fine.total_fine,
            paid_at: Math.floor(Date.now() / 1000),
            collected_by: adminId,
            notes: notes ? `[WAIVED] ${notes}` : '[WAIVED]',
            updated_at: Math.floor(Date.now() / 1000)
        }, { returnDocument: 'after' });

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Fine',
            entityId: fineId,
            changes: { fine_code: fine.fine_code, action: 'waived', total_fine: fine.total_fine },
            status: 'SUCCESS'
        });

        return updatedFine.toObject({ virtuals: true });
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Fine',
            entityId: fineId,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

module.exports = { getAllFines, collectPayment, waiveFine };
