const Student = require('../db/models/Student.cjs');
const BookIssue = require('../db/models/BookIssue.cjs');
const { validate } = require('../utils/validation.cjs');
const AuditLogger = require('../utils/auditLogger.cjs');

async function getAllStudents(filters = {}) {
    const conditions = { is_deleted: 0 };

    if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        conditions.$or = [
            { name: searchRegex },
            { roll_number: searchRegex },
            { student_code: searchRegex }
        ];
    }

    if (filters.class && filters.class !== 'All') {
        conditions.class = filters.class;
    }

    const students = await Student.find(conditions).sort({ created_at: -1 });
    return students.map(student => student.toObject({ virtuals: true }));
}

async function createStudent(data, adminId, adminName) {
    try {
        // Validate input
        validate('student', {
            name: data.name,
            email: data.email,
            phone: data.phone,
            rollNumber: data.roll_number,
            className: data.class
        });

        const lastStudent = await Student.findOne().sort({ created_at: -1, _id: -1 });
        let nextId = 1;
        if (lastStudent && lastStudent.student_code) {
            const match = lastStudent.student_code.match(/STU(\d+)/);
            if (match) {
                nextId = parseInt(match[1]) + 1;
            }
        }
        const studentCode = `STU${String(nextId).padStart(4, '0')}`;

        const student = await Student.create({
            ...data,
            student_code: studentCode
        });

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Student',
            entityId: student._id,
            changes: { name: data.name, email: data.email, roll_number: data.roll_number },
            status: 'SUCCESS'
        });

        return student.toObject({ virtuals: true });
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'CREATE',
            entityType: 'Student',
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function updateStudent(id, data, adminId, adminName) {
    try {
        // Validate input
        validate('student', {
            name: data.name,
            email: data.email,
            phone: data.phone,
            rollNumber: data.roll_number,
            className: data.class
        });

        const oldStudent = await Student.findById(id);
        if (!oldStudent) throw new Error('Student not found');

        const student = await Student.findByIdAndUpdate(
            id,
            { ...data, updated_at: Math.floor(Date.now() / 1000) },
            { returnDocument: 'after' }
        );

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Student',
            entityId: id,
            changes: { before: oldStudent.toObject(), after: data },
            status: 'SUCCESS'
        });

        return student ? student.toObject({ virtuals: true }) : null;
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'UPDATE',
            entityType: 'Student',
            entityId: id,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

async function deleteStudent(id, adminId, adminName) {
    try {
        // Check for active issues
        const activeIssues = await BookIssue.find({ student_id: id, status: 'issued' });

        if (activeIssues.length > 0) {
            throw new Error('Cannot delete student with active book issues');
        }

        // Soft delete
        const student = await Student.findByIdAndUpdate(
            id,
            { is_deleted: 1, updated_at: Math.floor(Date.now() / 1000) },
            { returnDocument: 'after' }
        );

        if (!student) throw new Error('Student not found');

        // Audit log
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'DELETE',
            entityType: 'Student',
            entityId: id,
            changes: { name: student.name, student_code: student.student_code },
            status: 'SUCCESS'
        });

        return student ? student.toObject({ virtuals: true }) : null;
    } catch (error) {
        await AuditLogger.log({
            adminId,
            adminName,
            action: 'DELETE',
            entityType: 'Student',
            entityId: id,
            status: 'FAILED',
            errorMessage: error.message
        });
        throw error;
    }
}

module.exports = { getAllStudents, createStudent, updateStudent, deleteStudent };
