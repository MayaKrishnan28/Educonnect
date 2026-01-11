
const { MongoClient } = require('mongodb');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'educonnect';

const client = new MongoClient(MONGODB_URI);

async function getUsersCollection() {
    if (!client.topology || !client.topology.isConnected()) await client.connect();
    const db = client.db(DB_NAME);
    return db.collection('user');
}

async function main() {
    try {
        const col = await getUsersCollection();
        const users = await col.find({}, { projection: { email: 1, role: 1, name: 1 } }).toArray();
        const content = users.map(u => `Email: ${u.email} | Role: ${u.role}`).join('\n');
        fs.writeFileSync('users.txt', content);
        console.log('Done');
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();
