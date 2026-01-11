import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = (process.env.MONGODB_DB || 'educonnect').trim().replace(/^["']|["']$/g, '')

type GlobalWithMongo = typeof globalThis & {
	_mongoClient?: MongoClient
	_mongoDb?: Db
}

const globalWithMongo = globalThis as GlobalWithMongo

let client: MongoClient
let db: Db

if (globalWithMongo._mongoClient && globalWithMongo._mongoDb) {
	client = globalWithMongo._mongoClient
	db = globalWithMongo._mongoDb
} else {
	client = new MongoClient(MONGODB_URI)
	db = client.db(DB_NAME)

	// Ensure connection for the singleton
	client.connect().catch(err => console.error("MongoDB Connection Error:", err));

	if (process.env.NODE_ENV !== 'production') {
		globalWithMongo._mongoClient = client
		globalWithMongo._mongoDb = db
	}
}

export { client as mongoClient, db }

export async function connect() {
	return db
}
