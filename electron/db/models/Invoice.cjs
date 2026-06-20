const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true }
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
    invoice_number: { type: String, required: true, unique: true },
    issue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BookIssue' },
    fine_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Fine' },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    invoice_type: { type: String, required: true },
    line_items: [InvoiceItemSchema],
    subtotal: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    is_paid: { type: Number, default: 0 },
    generated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    notes: { type: String }
});

InvoiceSchema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        if (ret.issue_id && (ret.issue_id instanceof mongoose.Types.ObjectId)) {
            ret.issue_id = ret.issue_id.toString();
        }
        if (ret.fine_id && (ret.fine_id instanceof mongoose.Types.ObjectId)) {
            ret.fine_id = ret.fine_id.toString();
        }
        if (ret.student_id && (ret.student_id instanceof mongoose.Types.ObjectId)) {
            ret.student_id = ret.student_id.toString();
        }
        if (ret.generated_by && (ret.generated_by instanceof mongoose.Types.ObjectId)) {
            ret.generated_by = ret.generated_by.toString();
        }
        return ret;
    }
});

InvoiceSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        if (ret.issue_id && (ret.issue_id instanceof mongoose.Types.ObjectId)) {
            ret.issue_id = ret.issue_id.toString();
        }
        if (ret.fine_id && (ret.fine_id instanceof mongoose.Types.ObjectId)) {
            ret.fine_id = ret.fine_id.toString();
        }
        if (ret.student_id && (ret.student_id instanceof mongoose.Types.ObjectId)) {
            ret.student_id = ret.student_id.toString();
        }
        if (ret.generated_by && (ret.generated_by instanceof mongoose.Types.ObjectId)) {
            ret.generated_by = ret.generated_by.toString();
        }
        return ret;
    }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
