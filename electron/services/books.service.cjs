const Book = require('../db/models/Book.cjs');
const { validate } = require('../utils/validation.cjs');
const AuditLogger = require('../utils/auditLogger.cjs');

async function getAllBooks(filters = {}) {
    const conditions = { is_deleted: 0 };

    if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        conditions.$or = [
            { title: searchRegex },
            { author: searchRegex },
            { isbn: searchRegex },
            { book_code: searchRegex }
        ];
    }

    if (filters.category && filters.category !== 'All') {
        conditions.category = filters.category;
    }

    const books = await Book.find(conditions).sort({ created_at: -1 });
    return books.map(book => book.toObject({ virtuals: true }));
}

async function createBook(data, adminId, adminName) {
    try {
        // Validate input
        validate('book', data);

        const book = await Book.create({
            ...data,
            book_code: data.isbn,
            available_copies: data.total_copies
        });

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Book',
            entityId: book._id,
            changes: data,
            status: 'SUCCESS'
        });

        return book.toObject({ virtuals: true });
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Book',
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function updateBook(id, data, adminId, adminName) {
    try {
        // Validate input
        validate('book', data);

        const oldBook = await Book.findById(id);
        if (!oldBook) throw new Error('Book not found');

        const book = await Book.findByIdAndUpdate(
            id,
            { ...data, book_code: data.isbn, updated_at: Math.floor(Date.now() / 1000) },
            { returnDocument: 'after' }
        );

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Book',
            entityId: book._id,
            changes: { before: oldBook.toObject(), after: data },
            status: 'SUCCESS'
        });

        return book ? book.toObject({ virtuals: true }) : null;
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Book',
            entityId: id,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function deleteBook(id, adminId, adminName) {
    try {
        const book = await Book.findByIdAndUpdate(
            id,
            { is_deleted: 1, updated_at: Math.floor(Date.now() / 1000) },
            { returnDocument: 'after' }
        );

        if (!book) throw new Error('Book not found');

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'DELETE',
            entityType: 'Book',
            entityId: book._id,
            changes: book.toObject(),
            status: 'SUCCESS'
        });

        return book ? book.toObject({ virtuals: true }) : null;
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'DELETE',
            entityType: 'Book',
            entityId: id,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

module.exports = { getAllBooks, createBook, updateBook, deleteBook };
