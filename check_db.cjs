const mongoose = require('mongoose');
const { initDatabase } = require('./electron/db/db.cjs');
const { getAllIssues } = require('./electron/services/issues.service.cjs');
const Student = require('./electron/db/models/Student.cjs');

async function run() {
    await initDatabase();
    console.log('Connected to DB');
    const student = await Student.findOne({});
    if (!student) {
        console.log('No student found in DB');
        process.exit(0);
    }
    console.log('Found Student:', student._id, student.id);
    
    console.log('Calling getAllIssues with studentId (ObjectId):', student._id);
    const result1 = await getAllIssues({ studentId: student._id, status: 'issued' });
    console.log('Result 1 count:', result1.length);
    if (result1.length > 0) {
        console.log('Result 1 first item:', result1[0]);
    }

    console.log('Calling getAllIssues with studentId (string):', student._id.toString());
    const result2 = await getAllIssues({ studentId: student._id.toString(), status: 'issued' });
    console.log('Result 2 count:', result2.length);
    if (result2.length > 0) {
        console.log('Result 2 first item:', result2[0]);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
