const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'educonnect';

async function deleteUser(email) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const col = db.collection('user');

        const result = await col.deleteOne({ email: email });

        if (result.deletedCount > 0) {
            console.log(`Successfully deleted user: ${email}. You can now register as a new user.`);
        } else {
            console.log(`User ${email} not found in database.`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

const targetEmail = process.argv[2];
if (!targetEmail) {
    console.log("Please provide an email: node delete-user.js your@email.com");
    process.exit(1);
}

deleteUser(targetEmail);
