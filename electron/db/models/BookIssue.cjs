const mongoose = require('mongoose');

const BookIssueSchema = new mongoose.Schema({
    issue_code: { type: String, required: true, unique: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    issue_date: { type: Number, required: true },
    due_date: { type: Number, required: true },
    return_date: { type: Number },
    status: { type: String, required: true, default: 'issued' },
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    returned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    notes: { type: String },
    created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) }
});

BookIssueSchema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        if (ret.student_id && (ret.student_id instanceof mongoose.Types.ObjectId)) {
            ret.student_id = ret.student_id.toString();
        }
        if (ret.book_id && (ret.book_id instanceof mongoose.Types.ObjectId)) {
            ret.book_id = ret.book_id.toString();
        }
        if (ret.issued_by && (ret.issued_by instanceof mongoose.Types.ObjectId)) {
            ret.issued_by = ret.issued_by.toString();
        }
        if (ret.returned_to && (ret.returned_to instanceof mongoose.Types.ObjectId)) {
            ret.returned_to = ret.returned_to.toString();
        }
        return ret;
    }
});

BookIssueSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        if (ret.student_id && (ret.student_id instanceof mongoose.Types.ObjectId)) {
            ret.student_id = ret.student_id.toString();
        }
        if (ret.book_id && (ret.book_id instanceof mongoose.Types.ObjectId)) {
            ret.book_id = ret.book_id.toString();
        }
        if (ret.issued_by && (ret.issued_by instanceof mongoose.Types.ObjectId)) {
            ret.issued_by = ret.issued_by.toString();
        }
        if (ret.returned_to && (ret.returned_to instanceof mongoose.Types.ObjectId)) {
            ret.returned_to = ret.returned_to.toString();
        }
        return ret;
    }
});

module.exports = mongoose.model('BookIssue', BookIssueSchema);
