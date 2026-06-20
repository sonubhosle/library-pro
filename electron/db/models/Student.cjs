const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    student_code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    roll_number: { type: String },
    class: { type: String },
    year: { type: String },
    is_active: { type: Number, default: 1 },
    is_deleted: { type: Number, default: 0 },
    created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) }
});

StudentSchema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        return ret;
    }
});

StudentSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        return ret;
    }
});

module.exports = mongoose.model('Student', StudentSchema);
