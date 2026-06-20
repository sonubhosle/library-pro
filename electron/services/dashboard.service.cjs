const Book = require('../db/models/Book.cjs');
const Student = require('../db/models/Student.cjs');
const BookIssue = require('../db/models/BookIssue.cjs');
const Fine = require('../db/models/Fine.cjs');

async function getDashboardStats() {
    const now = Math.floor(Date.now() / 1000);

    // Total Books (Unique count)
    const totalBooks = await Book.countDocuments({ is_deleted: 0 });

    // Total Students
    const totalStudents = await Student.countDocuments({ is_deleted: 0 });

    // Issued Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = Math.floor(today.getTime() / 1000);
    const endOfDay = startOfDay + 86400;

    const issuedToday = await BookIssue.countDocuments({
        issue_date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Overdue Books
    const overdueBooks = await BookIssue.countDocuments({
        status: 'issued',
        due_date: { $lte: now }
    });

    // Fines Collected
    const finesCollectedResult = await Fine.aggregate([
        { $match: { is_paid: 1 } },
        { $group: { _id: null, total: { $sum: "$paid_amount" } } }
    ]);
    const finesCollected = finesCollectedResult[0]?.total || 0;

    // Pending Fines
    const pendingFinesResult = await Fine.aggregate([
        { $match: { is_paid: 0 } },
        { $group: { _id: null, total: { $sum: "$total_fine" } } }
    ]);
    const pendingFines = pendingFinesResult[0]?.total || 0;

    // Recent Issues
    const recentIssuesDocs = await BookIssue.find()
        .populate('student_id')
        .populate('book_id')
        .sort({ created_at: -1 })
        .limit(5);

    const recentIssues = recentIssuesDocs.map(doc => ({
        id: doc._id.toString(),
        student_name: doc.student_id?.name || 'Unknown Student',
        book_title: doc.book_id?.title || 'Unknown Book',
        due_date: doc.due_date,
        status: doc.status
    }));

    // Categories
    const categoriesResult = await Book.aggregate([
        { $match: { is_deleted: 0 } },
        { $group: { _id: "$category", value: { $sum: "$total_copies" } } }
    ]);
    const categories = categoriesResult.map(c => ({
        name: c._id || 'Uncategorized',
        value: c.value || 0
    }));

    // ── Weekly Activity (last 7 days) ──
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const dayStart = Math.floor(d.getTime() / 1000);
        const dayEnd = dayStart + 86400;

        const issuedCount = await BookIssue.countDocuments({
            issue_date: { $gte: dayStart, $lt: dayEnd }
        });
        const returnedCount = await BookIssue.countDocuments({
            status: 'returned',
            return_date: { $gte: dayStart, $lt: dayEnd }
        });

        weeklyActivity.push({
            day: dayNames[d.getDay()],
            issues: issuedCount,
            returns: returnedCount
        });
    }

    // ── Trend Metrics ──
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const startOfMonth = Math.floor(thisMonth.getTime() / 1000);

    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfLastMonth = Math.floor(lastMonth.getTime() / 1000);

    const booksAddedThisMonth = await Book.countDocuments({
        is_deleted: 0,
        created_at: { $gte: startOfMonth }
    });

    const studentsThisMonth = await Student.countDocuments({
        is_deleted: 0,
        created_at: { $gte: startOfMonth }
    });

    const studentsLastMonth = await Student.countDocuments({
        is_deleted: 0,
        created_at: { $gte: startOfLastMonth, $lt: startOfMonth }
    });

    const studentGrowth = studentsLastMonth > 0
        ? Math.round(((studentsThisMonth - studentsLastMonth) / studentsLastMonth) * 100)
        : (studentsThisMonth > 0 ? 100 : 0);

    const currentlyIssued = await BookIssue.countDocuments({ status: 'issued' });

    // Catalog coverage
    const totalBookEntries = await Book.countDocuments({ is_deleted: 0 });
    const booksWithCategory = await Book.countDocuments({
        is_deleted: 0,
        category: { $ne: null, $ne: "" }
    });
    const catalogCoverage = totalBookEntries > 0
        ? Math.round((booksWithCategory / totalBookEntries) * 100)
        : 0;

    // Inventory Health
    const totalCopiesResult = await Book.aggregate([
        { $match: { is_deleted: 0 } },
        { $group: { _id: null, total: { $sum: "$total_copies" } } }
    ]);
    const totalCopies = totalCopiesResult[0]?.total || 0;

    const availableCopiesResult = await Book.aggregate([
        { $match: { is_deleted: 0 } },
        { $group: { _id: null, total: { $sum: "$available_copies" } } }
    ]);
    const availableCopies = availableCopiesResult[0]?.total || 0;

    const totalIssuesEver = await BookIssue.countDocuments({});
    const totalReturned = await BookIssue.countDocuments({ status: 'returned' });

    const overdueRate = currentlyIssued > 0
        ? Math.round((overdueBooks / currentlyIssued) * 100)
        : 0;

    return {
        stats: {
            totalBooks,
            totalStudents,
            issuedToday,
            overdueBooks,
            finesCollected,
            pendingFines
        },
        recentIssues,
        categories,
        weeklyActivity,
        trends: {
            booksAddedThisMonth,
            studentGrowth,
            studentsAddedThisMonth: studentsThisMonth,
            currentlyIssued,
            catalogCoverage
        },
        inventoryHealth: {
            totalCopies,
            availableCopies,
            totalIssuesEver,
            totalReturned,
            overdueRate
        }
    };
}

module.exports = { getDashboardStats };
