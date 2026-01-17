import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { User } from "@/models/User";
import { Client } from "@/models/Client";
import { InvoiceDocument } from "@/models/Invoice";
import { Document } from "@/models/Document";
import { StatementDocument } from "@/models/Statement";
import { UserPreferences } from "@/models/UserPreferences";
import { UserDefaults } from "@/models/UserDefaults";
import { promises as fs } from "fs";
import { join } from "path";
import { gzip, gunzip } from "zlib";
import { promisify } from "util";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface BackupData {
    metadata: {
        userId: string;
        email: string;
        backupDate: string;
        version: string;
        dataCounts: {
            clients: number;
            invoices: number;
            documents: number;
            statements: number;
            preferences: number;
            defaults: number;
        };
    };
    data: {
        user: Omit<User, "_id" | "password">;
        clients: Client[];
        invoices: InvoiceDocument[];
        documents: Document[];
        statements: StatementDocument[];
        preferences: UserPreferences | null;
        defaults: UserDefaults[];
    };
}

export interface BackupMetadata {
    id: string;
    filename: string;
    userId: string;
    email: string;
    backupDate: string;
    fileSize: number;
    dataCounts: {
        clients: number;
        invoices: number;
        documents: number;
        statements: number;
        preferences: number;
        defaults: number;
    };
}

const BACKUP_DIR = join(process.cwd(), "backups");

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(): Promise<void> {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

/**
 * Collect all user data for backup
 */
export async function collectUserData(userId: string): Promise<BackupData> {
    const db = await getDb();
    const userIdObj = new ObjectId(userId);

    // Get user (without password)
    const usersCollection = db.collection<User>("users");
    const user = await usersCollection.findOne({ _id: userIdObj });
    if (!user) {
        throw new Error("User not found");
    }

    // Collect all collections
    const [clients, invoices, documents, statements, preferences, defaults] = await Promise.all([
        // Clients
        db.collection<Client>("clients")
            .find({ userId: userIdObj })
            .toArray(),
        // Invoices
        db.collection<InvoiceDocument>("invoices")
            .find({ userId: userIdObj })
            .toArray(),
        // Documents
        db.collection<Document>("documents")
            .find({ userId: userIdObj })
            .toArray(),
        // Statements
        db.collection<StatementDocument>("statements")
            .find({ userId: userIdObj })
            .toArray(),
        // Preferences
        db.collection<UserPreferences>("userPreferences")
            .findOne({ userId: userIdObj }),
        // Defaults
        db.collection<UserDefaults>("userDefaults")
            .find({ userId: userIdObj })
            .toArray(),
    ]);

    // Format user data (exclude password)
    const { password, ...userData } = user;

    return {
        metadata: {
            userId: userId,
            email: user.email,
            backupDate: new Date().toISOString(),
            version: "1.0",
            dataCounts: {
                clients: clients.length,
                invoices: invoices.length,
                documents: documents.length,
                statements: statements.length,
                preferences: preferences ? 1 : 0,
                defaults: defaults.length,
            },
        },
        data: {
            user: userData as Omit<User, "_id" | "password">,
            clients,
            invoices,
            documents,
            statements,
            preferences: preferences || null,
            defaults,
        },
    };
}

/**
 * Create backup file
 */
export async function createBackupFile(userId: string, email: string): Promise<string> {
    await ensureBackupDir();

    // Collect user data
    const backupData = await collectUserData(userId);

    // Convert to JSON string
    const jsonString = JSON.stringify(backupData, null, 2);

    // Compress with gzip
    const compressed = (await gzipAsync(jsonString)) as Buffer;

    // Create filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const shortUserId = userId.substring(0, 8);
    const filename = `backup-user-${timestamp}-${shortUserId}.json.gz`;

    // Write file
    const filepath = join(BACKUP_DIR, filename);
    // Convert Buffer to Uint8Array for fs.writeFile
    const uint8Array = new Uint8Array(compressed);
    await fs.writeFile(filepath, uint8Array);

    return filename;
}

/**
 * Read backup file
 */
export async function readBackupFile(filename: string): Promise<BackupData> {
    const filepath = join(BACKUP_DIR, filename);

    // Check if file exists
    try {
        await fs.access(filepath);
    } catch {
        throw new Error("Backup file not found");
    }

    // Read compressed file
    const compressed = await fs.readFile(filepath);

    // Decompress
    const decompressed = await gunzipAsync(compressed as any);

    // Parse JSON
    const backupData = JSON.parse(decompressed.toString("utf-8")) as BackupData;

    return backupData;
}

/**
 * List all backups for a user
 */
export async function listUserBackups(userId: string): Promise<BackupMetadata[]> {
    await ensureBackupDir();

    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter((f) => f.startsWith("backup-user-") && f.endsWith(".json.gz"));

        const backups: BackupMetadata[] = [];

        for (const filename of backupFiles) {
            try {
                const filepath = join(BACKUP_DIR, filename);
                const stats = await fs.stat(filepath);

                // Extract userId from filename (last part before extension)
                const parts = filename.replace(".json.gz", "").split("-");
                const fileUserId = parts[parts.length - 1];

                // Only include backups for this user
                if (userId.startsWith(fileUserId)) {
                    // Try to read metadata from file
                    try {
                        const backupData = await readBackupFile(filename);
                        backups.push({
                            id: filename,
                            filename,
                            userId: backupData.metadata.userId,
                            email: backupData.metadata.email,
                            backupDate: backupData.metadata.backupDate,
                            fileSize: stats.size,
                            dataCounts: backupData.metadata.dataCounts,
                        });
                    } catch {
                        // If can't read, create basic metadata
                        backups.push({
                            id: filename,
                            filename,
                            userId: fileUserId,
                            email: "unknown",
                            backupDate: stats.birthtime.toISOString(),
                            fileSize: stats.size,
                            dataCounts: {
                                clients: 0,
                                invoices: 0,
                                documents: 0,
                                statements: 0,
                                preferences: 0,
                                defaults: 0,
                            },
                        });
                    }
                }
            } catch (error) {
                console.error(`Error reading backup file ${filename}:`, error);
            }
        }

        // Sort by date (newest first)
        backups.sort((a, b) => new Date(b.backupDate).getTime() - new Date(a.backupDate).getTime());

        return backups;
    } catch (error) {
        console.error("Error listing backups:", error);
        return [];
    }
}

/**
 * Delete backup file
 */
export async function deleteBackupFile(filename: string): Promise<void> {
    const filepath = join(BACKUP_DIR, filename);
    try {
        await fs.unlink(filepath);
    } catch (error) {
        console.error(`Error deleting backup file ${filename}:`, error);
        throw new Error("Failed to delete backup file");
    }
}

/**
 * Cleanup old backups (keep last N backups)
 */
export async function cleanupOldBackups(userId: string, keepCount: number = 10): Promise<number> {
    const backups = await listUserBackups(userId);

    if (backups.length <= keepCount) {
        return 0;
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
        try {
            await deleteBackupFile(backup.filename);
            deletedCount++;
        } catch (error) {
            console.error(`Error deleting backup ${backup.filename}:`, error);
        }
    }

    return deletedCount;
}

/**
 * ObjectId mapping for restore operations
 */
export class ObjectIdMapper {
    private mappings: Map<string, ObjectId> = new Map();

    /**
     * Map old ID to new ID
     */
    set(oldId: string, newId: ObjectId): void {
        this.mappings.set(oldId, newId);
    }

    /**
     * Get new ID for old ID, or return new ObjectId if not found
     */
    get(oldId: string | ObjectId | undefined): ObjectId {
        if (!oldId) {
            return new ObjectId();
        }
        const idString = oldId.toString();
        return this.mappings.get(idString) || new ObjectId();
    }

    /**
     * Check if mapping exists
     */
    has(oldId: string | ObjectId): boolean {
        return this.mappings.has(oldId.toString());
    }

    /**
     * Clear all mappings
     */
    clear(): void {
        this.mappings.clear();
    }
}

