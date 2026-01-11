const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'educonnect';

async function updateRole(email, newRole) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const col = db.collection('user');

        const result = await col.updateOne(
            { email: email },
            { $set: { role: newRole } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully updated ${email} to ${newRole}`);
        } else {
            console.log(`User ${email} not found`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

const targetEmail = process.argv[2] || "krishnanmaya174@gmail.com";
const targetRole = process.argv[3] || "TEACHER";

updateRole(targetEmail, targetRole);
