const { initDatabase } = require('./db.cjs');
const Setting = require('./models/Setting.cjs');
const Student = require('./models/Student.cjs');

async function seed() {
    await initDatabase();

    const defaultSettings = [
        { key: 'library_name', value: 'LibraryPro College Library' },
        { key: 'library_address', value: '123 College Road, University Town' },
        { key: 'library_phone', value: '+1 234 567 890' },
        { key: 'library_email', value: 'library@college.edu' },
        { key: 'issue_period_days', value: '30' },
        { key: 'per_day_fine', value: '10' },
        { key: 'max_books_per_student', value: '3' },
        { key: 'currency_symbol', value: '₹' },
        { key: 'auto_backup', value: 'true' },
        { key: 'backup_interval_days', value: '1' },
        { key: 'theme', value: 'dark' },
        { key: 'allow_offline', value: 'true' },
        { key: 'block_issue_on_pending_fine', value: 'false' }
    ];

    console.log('Seeding default settings...');

    for (const s of defaultSettings) {
        try {
            await Setting.findOneAndUpdate(
                { key: s.key },
                { value: s.value },
                { upsert: true, returnDocument: 'after' }
            );
        } catch (error) {
            console.error(`Failed to seed setting ${s.key}:`, error);
        }
    }

    // Migrate existing students - set is_active to 1 if not set
    try {
        const result = await Student.updateMany(
            { is_active: { $exists: false } },
            { $set: { is_active: 1 } }
        );
        if (result.modifiedCount > 0) {
            console.log(`Migrated ${result.modifiedCount} existing students (set is_active to 1)`);
        }
    } catch (error) {
        console.error('Failed to migrate students:', error);
    }

    console.log('Seeding completed');
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seed };
