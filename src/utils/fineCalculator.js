export function calculateFine(issue, bookPrice, perDayCharge = 10) {
    const today = Date.now();
    const due = issue.due_date * 1000;
    const returned = issue.return_date ? issue.return_date * 1000 : today;

    if (issue.status === 'lost') {
        // Lost book: recover full book price
        // PLUS ₹10/day from due date to TODAY (even if paid late)
        const daysLate = Math.max(0, Math.floor((today - due) / 86400000));
        const lateFine = daysLate * perDayCharge;
        const totalFine = bookPrice + lateFine;
        return { type: 'lost_book', daysLate, lateFine, bookPrice, totalFine };
    }

    if (returned > due) {
        // Late return: ₹10/day for each day past due date
        const daysLate = Math.ceil((returned - due) / 86400000);
        const totalFine = daysLate * perDayCharge;
        return { type: 'late_return', daysLate, lateFine: totalFine, bookPrice: 0, totalFine };
    }

    return { type: 'none', daysLate: 0, lateFine: 0, bookPrice: 0, totalFine: 0 };
}
