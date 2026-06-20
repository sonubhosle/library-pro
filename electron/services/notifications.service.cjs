const BookIssue = require('../db/models/BookIssue.cjs');
const Student = require('../db/models/Student.cjs');
const Book = require('../db/models/Book.cjs');
const Setting = require('../db/models/Setting.cjs');
const { sendEmail } = require('./email.service.cjs');
const { logger } = require('../utils/logger.cjs');

/**
 * Get all overdue book issues with student & book info
 */
async function getOverdueBooks() {
    const nowUnix = Math.floor(Date.now() / 1000);

    const overdueIssues = await BookIssue.find({
        status: 'issued',
        due_date: { $lt: nowUnix }
    })
        .populate('student_id')
        .populate('book_id')
        .sort({ due_date: 1 });

    return overdueIssues.map(issue => {
        const obj = issue.toObject({ virtuals: true });
        const daysOverdue = Math.ceil((Date.now() - issue.due_date * 1000) / 86400000);
        return {
            ...obj,
            daysOverdue,
            student: issue.student_id ? issue.student_id.toObject({ virtuals: true }) : null,
            book: issue.book_id ? issue.book_id.toObject({ virtuals: true }) : null
        };
    });
}

/**
 * Build the overdue reminder email HTML
 */
function buildOverdueEmailHtml({ studentName, libraryName, bookTitle, issueCode, dueDate, daysOverdue, perDayFine }) {
    const dueDateStr = new Date(dueDate * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    const estimatedFine = daysOverdue * perDayFine;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; }
    .header p { color: #ccfbf1; margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .alert-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .alert-box p { margin: 0; font-size: 14px; color: #92400e; font-weight: 600; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 13px; color: #64748b; font-weight: 600; }
    .info-value { font-size: 13px; color: #1e293b; font-weight: 700; }
    .fine-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center; }
    .fine-box .amount { font-size: 28px; font-weight: 800; color: #dc2626; }
    .fine-box .label { font-size: 12px; color: #991b1b; margin-top: 4px; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📚 ${libraryName}</h1>
      <p>Overdue Book Return Reminder</p>
    </div>
    <div class="body">
      <p style="font-size:15px;color:#334155;">Dear <strong>${studentName}</strong>,</p>
      <p style="font-size:14px;color:#475569;margin-bottom:20px;">
        This is a reminder that you have an overdue book. Please return it as soon as possible to avoid additional fines.
      </p>

      <div class="alert-box">
        <p>⚠️ This book is <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong>. Additional charges apply for each day.</p>
      </div>

      <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;">
        <div class="info-row"><span class="info-label">Book Title</span><span class="info-value">${bookTitle}</span></div>
        <div class="info-row"><span class="info-label">Issue Code</span><span class="info-value">${issueCode}</span></div>
        <div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${dueDateStr}</span></div>
        <div class="info-row"><span class="info-label">Days Overdue</span><span class="info-value" style="color:#dc2626;">${daysOverdue} days</span></div>
        <div class="info-row"><span class="info-label">Fine Per Day</span><span class="info-value">₹${perDayFine}</span></div>
      </div>

      <div class="fine-box">
        <div class="amount">₹${estimatedFine}</div>
        <div class="label">Estimated fine as of today</div>
      </div>

      <p style="font-size:13px;color:#64748b;">
        Please visit the library immediately to return the book and settle any outstanding fines. 
        Contact the library if you need assistance.
      </p>
    </div>
    <div class="footer">
      <p>${libraryName} · Automated Reminder · Do not reply to this email</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send overdue reminder to a single student for one issue
 */
async function sendOverdueReminder(issue) {
    try {
        const libraryNameSetting = await Setting.findOne({ key: 'library_name' });
        const perDayFineSetting = await Setting.findOne({ key: 'per_day_fine' });

        const libraryName = libraryNameSetting?.value || 'LibraryPro';
        const perDayFine = parseInt(perDayFineSetting?.value || 10);

        if (!issue.student?.email) {
            logger.warn(`No email for student ${issue.student?.name}, skipping overdue reminder`);
            return { skipped: true, reason: 'No student email' };
        }

        const html = buildOverdueEmailHtml({
            studentName: issue.student.name,
            libraryName,
            bookTitle: issue.book?.title || 'Unknown Book',
            issueCode: issue.issue_code,
            dueDate: issue.due_date,
            daysOverdue: issue.daysOverdue,
            perDayFine
        });

        await sendEmail({
            to: issue.student.email,
            subject: `[${libraryName}] Overdue Book Reminder - ${issue.book?.title || 'Library Book'}`,
            html
        });

        logger.info(`Overdue reminder sent to ${issue.student.email} for issue ${issue.issue_code}`);
        return { success: true, email: issue.student.email };
    } catch (error) {
        logger.error(`Failed to send overdue reminder: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Send fine payment confirmation
 */
async function sendFineNotification({ studentEmail, studentName, fineCode, amount, totalFine, isPaid }) {
    try {
        const libraryNameSetting = await Setting.findOne({ key: 'library_name' });
        const libraryName = libraryNameSetting?.value || 'LibraryPro';

        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 800; }
    .body { padding: 32px; }
    .status-box { background: ${isPaid ? '#f0fdf4' : '#fef3c7'}; border: 1px solid ${isPaid ? '#86efac' : '#fcd34d'}; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center; }
    .status-box .status { font-size: 20px; font-weight: 800; color: ${isPaid ? '#15803d' : '#92400e'}; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>📚 ${libraryName}</h1></div>
    <div class="body">
      <p style="font-size:15px;color:#334155;">Dear <strong>${studentName}</strong>,</p>
      <div class="status-box">
        <div class="status">${isPaid ? '✅ Fine Paid' : '⚠️ Fine Updated'}</div>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Fine Code: ${fineCode}</p>
      </div>
      <p style="font-size:14px;color:#475569;">Amount collected: <strong>₹${amount}</strong></p>
      <p style="font-size:14px;color:#475569;">Total fine: <strong>₹${totalFine}</strong></p>
      ${isPaid ? '<p style="font-size:14px;color:#15803d;font-weight:600;">✓ Your fine has been fully settled. Thank you!</p>' : `<p style="font-size:14px;color:#92400e;">Remaining balance: ₹${totalFine - amount}</p>`}
    </div>
    <div class="footer"><p>${libraryName} · Automated Receipt · Do not reply</p></div>
  </div>
</body>
</html>`;

        await sendEmail({
            to: studentEmail,
            subject: `[${libraryName}] Fine ${isPaid ? 'Payment Confirmed' : 'Update'} - ${fineCode}`,
            html
        });

        logger.info(`Fine notification sent to ${studentEmail} for fine ${fineCode}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send fine notification: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Send invoice notification
 */
async function sendInvoiceNotification({ studentEmail, studentName, invoiceNumber, total, invoiceType }) {
    try {
        const libraryNameSetting = await Setting.findOne({ key: 'library_name' });
        const libraryName = libraryNameSetting?.value || 'LibraryPro';

        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 800; }
    .body { padding: 32px; }
    .invoice-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 28px; font-weight: 800; color: #1e40af; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>📋 ${libraryName} — Invoice</h1></div>
    <div class="body">
      <p style="font-size:15px;color:#334155;">Dear <strong>${studentName}</strong>,</p>
      <p style="font-size:14px;color:#475569;">An invoice has been generated for your account.</p>
      <div class="invoice-box">
        <p style="margin:0 0 8px;font-size:13px;color:#3b82f6;font-weight:700;">Invoice #${invoiceNumber}</p>
        <div class="amount">₹${total}</div>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Type: ${invoiceType}</p>
      </div>
      <p style="font-size:13px;color:#64748b;">Please visit the library to settle this invoice or contact the librarian for assistance.</p>
    </div>
    <div class="footer"><p>${libraryName} · Automated Invoice · Do not reply</p></div>
  </div>
</body>
</html>`;

        await sendEmail({
            to: studentEmail,
            subject: `[${libraryName}] Invoice Generated - ${invoiceNumber}`,
            html
        });

        logger.info(`Invoice notification sent to ${studentEmail} for invoice ${invoiceNumber}`);
        return { success: true };
    } catch (error) {
        logger.error(`Failed to send invoice notification: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Run overdue reminders for all overdue books (call daily)
 */
async function sendAllOverdueReminders() {
    logger.info('Starting bulk overdue reminder send...');
    const overdueIssues = await getOverdueBooks();

    const results = { sent: 0, skipped: 0, failed: 0, total: overdueIssues.length };

    for (const issue of overdueIssues) {
        const result = await sendOverdueReminder(issue);
        if (result.success) results.sent++;
        else if (result.skipped) results.skipped++;
        else results.failed++;
    }

    logger.info(`Overdue reminders: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed out of ${results.total}`);
    return results;
}


