const Book = require('../db/models/Book.cjs');
const { validate } = require('../utils/validation.cjs');
const Student = require('../db/models/Student.cjs');
const BookIssue = require('../db/models/BookIssue.cjs');
const Fine = require('../db/models/Fine.cjs');
const Setting = require('../db/models/Setting.cjs');
const AuditLogger = require('../utils/auditLogger.cjs');

function calculateFineLogic(issue, bookPrice, perDayCharge = 10) {
    const today = Date.now();
    const due = issue.due_date * 1000;
    const returned = issue.return_date ? issue.return_date * 1000 : today;

    if (issue.status === 'lost') {
        const daysLate = Math.max(0, Math.floor((today - due) / 86400000));
        const lateFine = daysLate * perDayCharge;
        const totalFine = bookPrice + lateFine;
        return { type: 'lost_book', daysLate, lateFine, bookPrice, totalFine };
    }

    if (returned > due) {
        const daysLate = Math.ceil((returned - due) / 86400000);
        const totalFine = daysLate * perDayCharge;
        return { type: 'late_return', daysLate, lateFine: totalFine, bookPrice: 0, totalFine };
    }

    return { type: 'none', daysLate: 0, lateFine: 0, bookPrice: 0, totalFine: 0 };
}

async function issueBook(data, adminId, adminName) {
    // Validate issue data before proceeding
    validate('issue', data);
    try {
        // Validate book availability
        const book = await Book.findById(data.book_id);
        if (!book) throw new Error('Book not found');
        if (book.available_copies <= 0) throw new Error('Book out of stock');

        // Validate student active issues
        const activeIssues = await BookIssue.find({ student_id: data.student_id, status: 'issued' });

        const maxBooksSetting = await Setting.findOne({ key: 'max_books_per_student' });
        const maxBooks = parseInt(maxBooksSetting?.value || 3);
        if (activeIssues.length >= maxBooks) {
            throw new Error('Student reached maximum book limit');
        }

        // Generate issue code
        const lastIssue = await BookIssue.findOne().sort({ created_at: -1, _id: -1 });
        let nextId = 1;
        if (lastIssue && lastIssue.issue_code) {
            const match = lastIssue.issue_code.match(/ISS\d{6}(\d+)/);
            if (match) {
                nextId = parseInt(match[1]) + 1;
            } else {
                const simpleMatch = lastIssue.issue_code.match(/ISS(\d+)/);
                if (simpleMatch) nextId = parseInt(simpleMatch[1]) + 1;
            }
        }
        const now = new Date();
        const dateStr = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
        const issueCode = `ISS${dateStr}${String(nextId).padStart(4, '0')}`;

        // Create issue
        const issue = await BookIssue.create({
            ...data,
            issue_code: issueCode,
            status: 'issued'
        });

        // Update book copies
        await Book.findByIdAndUpdate(data.book_id, { $inc: { available_copies: -1 } });

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Issue',
            entityId: issue._id,
            changes: { issue_code: issueCode, book_id: data.book_id, student_id: data.student_id },
            status: 'SUCCESS'
        });

        return issue.toObject({ virtuals: true });
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Issue',
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function returnBook(issueId, data, adminId, adminName) {
    try {
        const issue = await BookIssue.findById(issueId);
        if (!issue) throw new Error('Issue record not found');
        const book = await Book.findById(issue.book_id);
        if (!book) throw new Error('Book not found');

        const returnDate = Math.floor(Date.now() / 1000);
        const perDayFineSetting = await Setting.findOne({ key: 'per_day_fine' });
        const perDayCharge = parseInt(perDayFineSetting?.value || 10);

        const fineDetails = calculateFineLogic({ ...issue.toObject(), return_date: returnDate }, book.price, perDayCharge);

        // Update issue status
        const updatedIssue = await BookIssue.findByIdAndUpdate(issueId, {
            status: 'returned',
            return_date: returnDate,
            returned_to: data.admin_id,
            notes: data.notes
        }, { returnDocument: 'after' });

        // Update book copies
        const updatedBook = await Book.findByIdAndUpdate(issue.book_id, { $inc: { available_copies: 1 } }, { returnDocument: 'after' });

        // If fine, create fine record
        if (fineDetails.totalFine > 0) {
            const lastFine = await Fine.findOne().sort({ created_at: -1, _id: -1 });
            let nextFineId = 1;
            if (lastFine && lastFine.fine_code) {
                const match = lastFine.fine_code.match(/FIN\d{4}(\d+)/);
                if (match) {
                    nextFineId = parseInt(match[1]) + 1;
                } else {
                    const simpleMatch = lastFine.fine_code.match(/FIN(\d+)/);
                    if (simpleMatch) nextFineId = parseInt(simpleMatch[1]) + 1;
                }
            }
            const fineCode = `FIN${new Date().getFullYear()}${String(nextFineId).padStart(4, '0')}`;

            const isPaid = parseInt(data.is_paid) === 1 ? 1 : 0;
            const paidAt = isPaid ? Math.floor(Date.now() / 1000) : null;
            const paidAmount = isPaid ? (parseFloat(data.paid_amount) || fineDetails.totalFine) : 0;
            const collectedBy = isPaid ? data.admin_id : null;

            const fineDoc = await Fine.create({
                fine_code: fineCode,
                issue_id: issueId,
                student_id: issue.student_id,
                fine_type: fineDetails.type,
                late_days: fineDetails.daysLate,
                per_day_charge: perDayCharge,
                late_fine: fineDetails.lateFine,
                book_price: fineDetails.bookPrice,
                total_fine: fineDetails.totalFine,
                is_paid: isPaid,
                paid_at: paidAt,
                paid_amount: paidAmount,
                collected_by: collectedBy,
                notes: data.notes
            });

            fineDetails.fine_id = fineDoc._id.toString();
            fineDetails.fine_code = fineDoc.fine_code;
        }

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Issue',
            entityId: issueId,
            changes: { status: 'returned', fine: fineDetails.totalFine > 0 ? fineDetails : null },
            status: 'SUCCESS'
        });

        return {
            success: true,
            fine: fineDetails,
            issue: updatedIssue.toObject({ virtuals: true }),
            book: updatedBook.toObject({ virtuals: true })
        };
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Issue',
            entityId: issueId,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function markAsLost(issueId, data, adminId, adminName) {
    try {
        const issue = await BookIssue.findById(issueId);
        if (!issue) throw new Error('Issue record not found');
        const book = await Book.findById(issue.book_id);
        if (!book) throw new Error('Book not found');

        const perDayFineSetting = await Setting.findOne({ key: 'per_day_fine' });
        const perDayCharge = parseInt(perDayFineSetting?.value || 10);

        const fineDetails = calculateFineLogic({ ...issue.toObject(), status: 'lost' }, book.price, perDayCharge);

        // Update issue status
        const updatedIssue = await BookIssue.findByIdAndUpdate(issueId, {
            status: 'lost',
            notes: data.notes
        }, { returnDocument: 'after' });

        // Create fine record
        const lastFine = await Fine.findOne().sort({ created_at: -1, _id: -1 });
        let nextFineId = 1;
        if (lastFine && lastFine.fine_code) {
            const match = lastFine.fine_code.match(/FIN\d{4}(\d+)/);
            if (match) {
                nextFineId = parseInt(match[1]) + 1;
            } else {
                const simpleMatch = lastFine.fine_code.match(/FIN(\d+)/);
                if (simpleMatch) nextFineId = parseInt(simpleMatch[1]) + 1;
            }
        }
        const fineCode = `FIN${new Date().getFullYear()}${String(nextFineId).padStart(4, '0')}`;

        const isPaid = parseInt(data.is_paid) === 1 ? 1 : 0;
        const paidAt = isPaid ? Math.floor(Date.now() / 1000) : null;
        const paidAmount = isPaid ? (parseFloat(data.paid_amount) || fineDetails.totalFine) : 0;
        const collectedBy = isPaid ? data.admin_id : null;

        const fineDoc = await Fine.create({
            fine_code: fineCode,
            issue_id: issueId,
            student_id: issue.student_id,
            fine_type: 'lost_book',
            late_days: fineDetails.daysLate,
            per_day_charge: perDayCharge,
            late_fine: fineDetails.lateFine,
            book_price: fineDetails.bookPrice,
            total_fine: fineDetails.totalFine,
            is_paid: isPaid,
            paid_at: paidAt,
            paid_amount: paidAmount,
            collected_by: collectedBy,
            notes: data.notes
        });

        fineDetails.fine_id = fineDoc._id.toString();
        fineDetails.fine_code = fineDoc.fine_code;

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Issue',
            entityId: issueId,
            changes: { status: 'lost', fine_code: fineCode, total_fine: fineDetails.totalFine },
            status: 'SUCCESS'
        });

        return {
            success: true,
            fine: fineDetails,
            issue: updatedIssue.toObject({ virtuals: true }),
            book: book.toObject({ virtuals: true })
        };
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Issue',
            entityId: issueId,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function getAllIssues(filters = {}) {
    const conditions = {};
    if (filters.studentId) {
        conditions.student_id = filters.studentId;
    }
    if (filters.status) {
        conditions.status = filters.status;
    }

    const issues = await BookIssue.find(conditions)
        .populate('book_id')
        .populate('student_id')
        .sort({ created_at: -1 });

    return issues.map(issue => {
        const obj = issue.toObject({ virtuals: true });
        if (issue.book_id) {
            obj.book = issue.book_id.toObject ? issue.book_id.toObject({ virtuals: true }) : issue.book_id;
        }
        if (issue.student_id) {
            obj.student = issue.student_id.toObject ? issue.student_id.toObject({ virtuals: true }) : issue.student_id;
        }
        return obj;
    });
}

module.exports = { issueBook, returnBook, markAsLost, getAllIssues };
