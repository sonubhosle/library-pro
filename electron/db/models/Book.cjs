const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    book_code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String },
    category: { type: String },
    price: { type: Number, default: 0 },
    total_copies: { type: Number, default: 0 },
    available_copies: { type: Number, default: 0 },
    is_deleted: { type: Number, default: 0 },
    created_at: { type: Number, default: () => Math.floor(Date.now() / 1000) },
    updated_at: { type: Number, default: () => Math.floor(Date.now() / 1000) }
});

BookSchema.set('toObject', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        return ret;
    }
});

BookSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        return ret;
    }
});

module.exports = mongoose.model('Book', BookSchema);
