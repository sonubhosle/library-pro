const { z } = require('zod');

// Common validation schemas
const schemas = {
    // Book validation
    book: z.object({
        title: z.string().min(1, 'Title required').max(200),
        isbn: z.string().min(1, 'ISBN required').max(20),
        author: z.string().min(1, 'Author required').max(100),
        price: z.number().min(0, 'Price cannot be negative'),
        total_copies: z.number().int().min(0, 'Total copies cannot be negative'),
        category: z.string().min(1, 'Category required').max(50),
    }),

    // Student validation
    student: z.object({
        name: z.string().min(2, 'Name too short').max(100),
        email: z.string().email('Invalid email'),
        phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
        rollNumber: z.string().min(1, 'Roll number required').max(20),
        className: z.string().min(1, 'Class required').max(50),
    }),

    // Book Issue validation
    issue: z.object({
        student_id: z.string().min(1, 'Student ID required'),
        book_id: z.string().min(1, 'Book ID required'),
        issue_date: z.number().int('Invalid date'),
        due_date: z.number().int('Invalid date'),
    }),

    // Fine validation
    fine: z.object({
        studentId: z.string().min(1, 'Student ID required'),
        amount: z.number().positive('Amount must be positive'),
        reason: z.string().min(1, 'Reason required').max(500),
        issuedDate: z.string().datetime('Invalid date'),
    }),

    // Invoice validation
    invoice: z.object({
        studentId: z.string().min(1, 'Student ID required'),
        amount: z.number().positive('Amount must be positive'),
        description: z.string().min(1, 'Description required').max(500),
        dueDate: z.string().datetime('Invalid date'),
    }),

    // Admin password change
    passwordChange: z.object({
        adminId: z.string().min(1, 'Admin ID required'),
        currentPassword: z.string().min(6, 'Current password required'),
        newPassword: z.string()
            .min(6, 'Password must be at least 6 characters')
            .regex(/[A-Z]/, 'Password must contain uppercase letter')
            .regex(/[0-9]/, 'Password must contain number'),
    }),

    // Fine payment validation
    finePayment: z.object({
        amount: z.number().positive('Amount must be positive'),
        adminId: z.string().min(1, 'Admin ID required'),
        adminName: z.string().min(2, 'Admin name required'),
        notes: z.string().optional()
    }),
    // Invoice validation (already defined as invoice schema, but ensure required fields)
    // No changes needed for existing invoice schema

    admin: z.object({
        name: z.string().min(2, 'Name too short').max(100),
        email: z.string().email('Invalid email'),
        password: z.string()
            .min(6, 'Password must be at least 6 characters')
            .regex(/[A-Z]/, 'Password must contain uppercase letter')
            .regex(/[0-9]/, 'Password must contain number'),
    }),

    // SMTP settings
    smtp: z.object({
        smtp_host: z.string().min(1, 'Host required'),
        smtp_port: z.string().regex(/^[0-9]+$/, 'Port must be a number'),
        smtp_user: z.string().email('User must be email'),
        smtp_pass: z.string().min(1, 'Password required'),
        smtp_from: z.string().email('From must be valid email'),
    }),
};

// Validation wrapper
function validate(schemaName, data) {
    if (!schemas[schemaName]) {
        throw new Error(`Unknown schema: ${schemaName}`);
    }
    
    const result = schemas[schemaName].safeParse(data);
    
    if (!result.success) {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
        throw new Error(JSON.stringify(errors));
    }
    
    return result.data;
}

module.exports = { validate, schemas };
