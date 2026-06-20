const Invoice = require('../db/models/Invoice.cjs');
const AuditLogger = require('../utils/auditLogger.cjs');

async function generateInvoice(data, adminId, adminName) {
    try {
        const year = new Date().getFullYear();
        const lastInvoice = await Invoice.findOne({ invoice_number: new RegExp(`^INV-${year}-`) })
            .sort({ generated_at: -1, _id: -1 });

        let nextNum = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoice_number.split('-');
            const lastNum = parseInt(parts[2]);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        const invoiceNumber = `INV-${year}-${String(nextNum).padStart(6, '0')}`;

        const invoice = await Invoice.create({
            invoice_number: invoiceNumber,
            issue_id: data.issue_id,
            fine_id: data.fine_id,
            student_id: data.student_id,
            invoice_type: data.type,
            line_items: data.items,
            subtotal: data.subtotal,
            total: data.total,
            is_paid: data.is_paid || 0,
            generated_by: data.admin_id
        });

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Invoice',
            entityId: invoice._id,
            changes: {
                invoice_number: invoiceNumber,
                type: data.type,
                total: data.total,
                student_id: data.student_id
            },
            status: 'SUCCESS'
        });

        return invoice.toObject({ virtuals: true });
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Invoice',
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function getInvoiceById(id) {
    const invoice = await Invoice.findById(id)
        .populate('student_id')
        .populate({
            path: 'issue_id',
            populate: { path: 'book_id' }
        })
        .populate('fine_id');
    return invoice ? [invoice.toObject({ virtuals: true })] : [];
}

async function getAllInvoices(filters = {}) {
    const conditions = {};
    if (filters.studentId) conditions.student_id = filters.studentId;
    if (filters.type) conditions.invoice_type = filters.type;
    if (filters.is_paid !== undefined) conditions.is_paid = filters.is_paid;

    const invoices = await Invoice.find(conditions)
        .populate('student_id')
        .populate({
            path: 'issue_id',
            populate: { path: 'book_id' }
        })
        .populate('fine_id')
        .sort({ generated_at: -1 });

    return invoices.map(inv => inv.toObject({ virtuals: true }));
}

async function deleteInvoice(id, adminId, adminName) {
    try {
        const invoice = await Invoice.findByIdAndDelete(id);
        if (!invoice) throw new Error('Invoice not found');

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'DELETE',
            entityType: 'Invoice',
            entityId: id,
            changes: { invoice_number: invoice.invoice_number },
            status: 'SUCCESS'
        });

        return true;
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'DELETE',
            entityType: 'Invoice',
            entityId: id,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

module.exports = { generateInvoice, getInvoiceById, getAllInvoices, deleteInvoice };
