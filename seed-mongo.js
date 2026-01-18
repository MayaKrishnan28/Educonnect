require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'educonnect';

const users = [
    { email: 'demo_student@edu.com', role: 'STUDENT', name: 'Demo Student', isVerified: true },
    { email: 'demo_teacher@edu.com', role: 'TEACHER', name: 'Demo Teacher', isVerified: true },
    { email: '22cs082@nandhaengg.org', role: 'STUDENT', name: 'Student 22cs082', isVerified: true },
    { email: '22cs116@nandhaengg.org', role: 'STUDENT', name: 'Student 22cs116', isVerified: true },
    { email: '22cs115@nandhaengg.org', role: 'STUDENT', name: 'Student 22cs115', isVerified: true },
    { email: '22cs120@nandhaengg.org', role: 'STUDENT', name: 'Student 22cs120', isVerified: true },
    { email: 'krishnanmaya174@gmail.com', role: 'STUDENT', name: 'Krishnan Maya', isVerified: true },
    { email: 'sabi.sabi9102004@gmail.com', role: 'TEACHER', name: 'S A B I', isVerified: true }
];

async function main() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const col = db.collection('user');

        // Clear existing (optional, but since it's empty according to my tests...)
        // await col.deleteMany({}); 

        for (const user of users) {
            await col.updateOne(
                { email: user.email },
                { $set: user },
                { upsert: true }
            );
            console.log(`Upserted: ${user.email}`);
        }
        console.log('Seeding complete.');
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

main();
