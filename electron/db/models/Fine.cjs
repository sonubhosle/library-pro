const mongoose = require('mongoose');

const FineSchema = new mongoose.Schema({
    fine_code: { type: String, required: true, unique: true },
    issue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BookIssue', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    fine_type: { type: String, required: true },
    late_days: { type: Number, default: 0 },
    per_day_charge: { type: Number, default: 10 },
    late_fine: { type: Number, default: 0 },
    book_price: { type: Number, default: 0 },
    total_fine: { type: Number, required: true, default: 0 },
    is_paid: { type: Number, default: 0 },
    paid_at: { type: Number },
    paid_amount: { type: Number, default: 0 },
    collected_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    notes: { type: String },
    created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) }
});

FineSchema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        if (ret.issue_id && (ret.issue_id instanceof mongoose.Types.ObjectId)) {
            ret.issue_id = ret.issue_id.toString();
        }
        if (ret.student_id && (ret.student_id instanceof mongoose.Types.ObjectId)) {
            ret.student_id = ret.student_id.toString();
        }
        if (ret.collected_by && (ret.collected_by instanceof mongoose.Types.ObjectId)) {
            ret.collected_by = ret.collected_by.toString();
        }
        return ret;
    }
});

FineSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        if (ret.issue_id && (ret.issue_id instanceof mongoose.Types.ObjectId)) {
            ret.issue_id = ret.issue_id.toString();
        }
        if (ret.student_id && (ret.student_id instanceof mongoose.Types.ObjectId)) {
            ret.student_id = ret.student_id.toString();
        }
        if (ret.collected_by && (ret.collected_by instanceof mongoose.Types.ObjectId)) {
            ret.collected_by = ret.collected_by.toString();
        }
        return ret;
    }
});

module.exports = mongoose.model('Fine', FineSchema);
