import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
    throw new Error("Please add your Mongo URI to .env.local");
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function getDb(): Promise<Db> {
    const client = await clientPromise;
    return client.db("invoify");
}

/**
 * Initialize database indexes for optimal query performance.
 * This should be called once when the application starts or when indexes are needed.
 */
export async function initializeIndexes(): Promise<void> {
    try {
        const db = await getDb();
        
        // Initialize indexes for invoices collection
        const invoicesCollection = db.collection("invoices");
        
        // Index on userId - used in almost every query
        await invoicesCollection.createIndex({ userId: 1 }, { background: true });
        
        // Compound index on userId and updatedAt - used for sorting invoices by user
        await invoicesCollection.createIndex({ userId: 1, updatedAt: -1 }, { background: true });
        
        // Index on receiver.email - used for finding invoices by client
        await invoicesCollection.createIndex({ "receiver.email": 1 }, { background: true });
        
        // Compound index on userId and receiver.email - used in client detail queries
        await invoicesCollection.createIndex({ userId: 1, "receiver.email": 1 }, { background: true });
        
        // Index on details.invoiceNumber - used for finding existing invoices
        await invoicesCollection.createIndex({ userId: 1, "details.invoiceNumber": 1 }, { 
            background: true,
            unique: false // Allow duplicates if needed, but index for fast lookup
        });
        
        // Index on createdAt - used for sorting
        await invoicesCollection.createIndex({ userId: 1, createdAt: -1 }, { background: true });
        
        // Initialize indexes for clients collection
        const clientsCollection = db.collection("clients");
        
        // Index on userId - used in almost every client query
        await clientsCollection.createIndex({ userId: 1 }, { background: true });
        
        // Compound index on userId and email - used for checking duplicate clients
        await clientsCollection.createIndex({ userId: 1, email: 1 }, { 
            background: true,
            unique: false
        });
        
        // Compound index on userId and name - used for sorting clients by name
        await clientsCollection.createIndex({ userId: 1, name: 1 }, { background: true });
        
        // Initialize indexes for users collection
        const usersCollection = db.collection("users");
        
        // Index on email - used for login and signup queries
        await usersCollection.createIndex({ email: 1 }, { 
            background: true,
            unique: true // Email should be unique
        });
        
        // Initialize indexes for documents collection
        const documentsCollection = db.collection("documents");
        
        // Index on userId - critical for security and performance
        await documentsCollection.createIndex({ userId: 1 }, { background: true });
        
        // Compound index on userId and invoiceId
        await documentsCollection.createIndex({ userId: 1, invoiceId: 1 }, { background: true });
        
        // Compound index on userId and isCurrentVersion
        await documentsCollection.createIndex({ userId: 1, isCurrentVersion: 1 }, { background: true });
        
        // Index on userId and parentDocumentId for version queries
        await documentsCollection.createIndex({ userId: 1, parentDocumentId: 1 }, { background: true });
        
        console.log("Database indexes initialized successfully");
    } catch (error) {
        console.error("Error initializing database indexes:", error);
        // Don't throw - indexes might already exist
    }
}

