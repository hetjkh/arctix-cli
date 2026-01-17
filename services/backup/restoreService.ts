import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { BackupData, ObjectIdMapper } from "./backupService";
import { Client } from "@/models/Client";
import { InvoiceDocument } from "@/models/Invoice";
import { Document } from "@/models/Document";
import { StatementDocument } from "@/models/Statement";
import { UserPreferences } from "@/models/UserPreferences";
import { UserDefaults } from "@/models/UserDefaults";

export type RestoreMode = "merge" | "replace";

export interface RestoreResult {
    success: boolean;
    restored: {
        clients: number;
        invoices: number;
        documents: number;
        statements: number;
        preferences: number;
        defaults: number;
    };
    skipped: {
        clients: number;
        invoices: number;
        documents: number;
        statements: number;
    };
    errors: string[];
}

/**
 * Restore user data from backup
 */
export async function restoreUserData(
    backupData: BackupData,
    targetUserId: string,
    mode: RestoreMode = "merge"
): Promise<RestoreResult> {
    const db = await getDb();
    const targetUserIdObj = new ObjectId(targetUserId);
    const mapper = new ObjectIdMapper();
    const result: RestoreResult = {
        success: true,
        restored: {
            clients: 0,
            invoices: 0,
            documents: 0,
            statements: 0,
            preferences: 0,
            defaults: 0,
        },
        skipped: {
            clients: 0,
            invoices: 0,
            documents: 0,
            statements: 0,
        },
        errors: [],
    };

    try {
        // Replace mode: Delete existing data
        if (mode === "replace") {
            await Promise.all([
                db.collection("clients").deleteMany({ userId: targetUserIdObj }),
                db.collection("invoices").deleteMany({ userId: targetUserIdObj }),
                db.collection("documents").deleteMany({ userId: targetUserIdObj }),
                db.collection("statements").deleteMany({ userId: targetUserIdObj }),
                db.collection("userPreferences").deleteMany({ userId: targetUserIdObj }),
                db.collection("userDefaults").deleteMany({ userId: targetUserIdObj }),
            ]);
        }

        // Restore Clients (first - needed for invoices/statements)
        const clientMappings = await restoreClients(
            db,
            backupData.data.clients,
            targetUserIdObj,
            mode,
            mapper,
            result
        );

        // Restore Invoices (after clients)
        await restoreInvoices(
            db,
            backupData.data.invoices,
            targetUserIdObj,
            mode,
            mapper,
            clientMappings,
            result
        );

        // Restore Statements (after clients and invoices)
        await restoreStatements(
            db,
            backupData.data.statements,
            targetUserIdObj,
            mode,
            mapper,
            clientMappings,
            result
        );

        // Restore Documents (may reference invoices)
        await restoreDocuments(
            db,
            backupData.data.documents,
            targetUserIdObj,
            mode,
            mapper,
            result
        );

        // Restore Preferences
        await restorePreferences(
            db,
            backupData.data.preferences,
            targetUserIdObj,
            mode,
            result
        );

        // Restore Defaults
        await restoreDefaults(
            db,
            backupData.data.defaults,
            targetUserIdObj,
            mode,
            result
        );
    } catch (error: any) {
        result.success = false;
        result.errors.push(error.message || "Unknown error during restore");
    }

    return result;
}

/**
 * Restore clients and return email to ObjectId mapping
 */
async function restoreClients(
    db: any,
    clients: Client[],
    targetUserId: ObjectId,
    mode: RestoreMode,
    mapper: ObjectIdMapper,
    result: RestoreResult
): Promise<Map<string, ObjectId>> {
    const emailToIdMap = new Map<string, ObjectId>();
    const clientsCollection = db.collection<Client>("clients");

    for (const client of clients) {
        try {
            const oldId = client._id?.toString() || "";
            const clientEmail = client.email.toLowerCase();

            if (mode === "merge") {
                // Check if client with same email exists
                const existing = await clientsCollection.findOne({
                    userId: targetUserId,
                    email: clientEmail,
                });

                if (existing) {
                    // Use existing ID
                    emailToIdMap.set(clientEmail, existing._id!);
                    mapper.set(oldId, existing._id!);
                    result.skipped.clients++;
                    continue;
                }
            }

            // Create new client
            const { _id, userId, ...clientData } = client;
            const newClient: Omit<Client, "_id"> = {
                ...clientData,
                userId: targetUserId,
                createdAt: client.createdAt || new Date(),
                updatedAt: client.updatedAt || new Date(),
            };

            const insertResult = await clientsCollection.insertOne(newClient as Client);
            const newId = insertResult.insertedId;

            emailToIdMap.set(clientEmail, newId);
            mapper.set(oldId, newId);
            result.restored.clients++;
        } catch (error: any) {
            result.errors.push(`Error restoring client: ${error.message}`);
        }
    }

    return emailToIdMap;
}

/**
 * Restore invoices
 */
async function restoreInvoices(
    db: any,
    invoices: InvoiceDocument[],
    targetUserId: ObjectId,
    mode: RestoreMode,
    mapper: ObjectIdMapper,
    clientEmailMap: Map<string, ObjectId>,
    result: RestoreResult
): Promise<void> {
    const invoicesCollection = db.collection<InvoiceDocument>("invoices");

    for (const invoice of invoices) {
        try {
            const oldId = invoice._id?.toString() || "";
            const invoiceNumber = invoice.details?.invoiceNumber || "";

            if (mode === "merge" && invoiceNumber) {
                // Check if invoice with same number exists
                const existing = await invoicesCollection.findOne({
                    userId: targetUserId,
                    "details.invoiceNumber": invoiceNumber,
                });

                if (existing) {
                    mapper.set(oldId, existing._id!);
                    result.skipped.invoices++;
                    continue;
                }
            }

            // Create new invoice
            const { _id, userId, ...invoiceData } = invoice;
            const newInvoice: Omit<InvoiceDocument, "_id"> = {
                ...invoiceData,
                userId: targetUserId,
                createdAt: invoice.createdAt || new Date(),
                updatedAt: invoice.updatedAt || new Date(),
            };

            const insertResult = await invoicesCollection.insertOne(newInvoice as InvoiceDocument);
            mapper.set(oldId, insertResult.insertedId);
            result.restored.invoices++;
        } catch (error: any) {
            result.errors.push(`Error restoring invoice: ${error.message}`);
        }
    }
}

/**
 * Restore statements
 */
async function restoreStatements(
    db: any,
    statements: StatementDocument[],
    targetUserId: ObjectId,
    mode: RestoreMode,
    mapper: ObjectIdMapper,
    clientEmailMap: Map<string, ObjectId>,
    result: RestoreResult
): Promise<void> {
    const statementsCollection = db.collection<StatementDocument>("statements");

    for (const statement of statements) {
        try {
            const { _id, userId, clientId, ...statementData } = statement;

            // Map clientId if it exists
            let newClientId: ObjectId | undefined;
            if (clientId) {
                // Try to find client by email
                const clientEmail = statement.clientEmail?.toLowerCase();
                newClientId = clientEmail ? clientEmailMap.get(clientEmail) : undefined;
            }

            // Create new statement
            const newStatement: Omit<StatementDocument, "_id"> = {
                ...statementData,
                userId: targetUserId,
                clientId: newClientId,
                createdAt: statement.createdAt || new Date(),
                updatedAt: statement.updatedAt || new Date(),
            };

            await statementsCollection.insertOne(newStatement as StatementDocument);
            result.restored.statements++;
        } catch (error: any) {
            result.errors.push(`Error restoring statement: ${error.message}`);
        }
    }
}

/**
 * Restore documents
 */
async function restoreDocuments(
    db: any,
    documents: Document[],
    targetUserId: ObjectId,
    mode: RestoreMode,
    mapper: ObjectIdMapper,
    result: RestoreResult
): Promise<void> {
    const documentsCollection = db.collection<Document>("documents");

    for (const document of documents) {
        try {
            const { _id, userId, invoiceId, parentDocumentId, uploadedBy, ...documentData } = document;

            // Map invoiceId and parentDocumentId
            const newInvoiceId = invoiceId ? mapper.get(invoiceId) : undefined;
            const newParentDocumentId = parentDocumentId ? mapper.get(parentDocumentId) : undefined;

            // Create new document
            const newDocument: Omit<Document, "_id"> = {
                ...documentData,
                userId: targetUserId,
                invoiceId: newInvoiceId,
                parentDocumentId: newParentDocumentId,
                uploadedBy: targetUserId, // Set to current user
                createdAt: document.createdAt || new Date(),
                updatedAt: document.updatedAt || new Date(),
            };

            await documentsCollection.insertOne(newDocument as Document);
            result.restored.documents++;
        } catch (error: any) {
            result.errors.push(`Error restoring document: ${error.message}`);
        }
    }
}

/**
 * Restore preferences
 */
async function restorePreferences(
    db: any,
    preferences: UserPreferences | null,
    targetUserId: ObjectId,
    mode: RestoreMode,
    result: RestoreResult
): Promise<void> {
    if (!preferences) {
        return;
    }

    try {
        const preferencesCollection = db.collection<UserPreferences>("userPreferences");

        if (mode === "replace") {
            // Delete existing
            await preferencesCollection.deleteOne({ userId: targetUserId });
        }

        // Upsert preferences
        const { _id, userId, ...preferencesData } = preferences;
        const newPreferences: Omit<UserPreferences, "_id"> = {
            ...preferencesData,
            userId: targetUserId,
            createdAt: preferences.createdAt || new Date(),
            updatedAt: preferences.updatedAt || new Date(),
        };

        await preferencesCollection.replaceOne(
            { userId: targetUserId },
            newPreferences as UserPreferences,
            { upsert: true }
        );

        result.restored.preferences = 1;
    } catch (error: any) {
        result.errors.push(`Error restoring preferences: ${error.message}`);
    }
}

/**
 * Restore defaults
 */
async function restoreDefaults(
    db: any,
    defaults: UserDefaults[],
    targetUserId: ObjectId,
    mode: RestoreMode,
    result: RestoreResult
): Promise<void> {
    const defaultsCollection = db.collection<UserDefaults>("userDefaults");

    for (const defaultItem of defaults) {
        try {
            const { _id, userId, ...defaultData } = defaultItem;

            if (mode === "merge") {
                // Check if default with same name exists
                const existing = await defaultsCollection.findOne({
                    userId: targetUserId,
                    name: defaultItem.name,
                });

                if (existing) {
                    // Update existing
                    await defaultsCollection.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                ...defaultData,
                                updatedAt: new Date(),
                            },
                        }
                    );
                    continue;
                }
            }

            // Create new default
            const newDefault: Omit<UserDefaults, "_id"> = {
                ...defaultData,
                userId: targetUserId,
                createdAt: defaultItem.createdAt || new Date(),
                updatedAt: defaultItem.updatedAt || new Date(),
            };

            await defaultsCollection.insertOne(newDefault as UserDefaults);
            result.restored.defaults++;
        } catch (error: any) {
            result.errors.push(`Error restoring default: ${error.message}`);
        }
    }
}

