const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'staff' },
    is_deleted: { type: Number, default: 0 },
    created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) }
});

AdminSchema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        return ret;
    }
});

AdminSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        return ret;
    }
});

module.exports = mongoose.model('Admin', AdminSchema);
