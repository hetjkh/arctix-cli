import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readBackupFile, listUserBackups } from "@/services/backup/backupService";
import { join } from "path";
import { promises as fs } from "fs";

/**
 * GET /api/backup/export-user?filename=...
 * Download backup file
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const filename = searchParams.get("filename");

        if (!filename) {
            return NextResponse.json(
                { error: "Backup filename is required" },
                { status: 400 }
            );
        }

        // Verify backup belongs to user
        const backups = await listUserBackups(user.userId);
        const backup = backups.find((b) => b.filename === filename);

        if (!backup) {
            return NextResponse.json(
                { error: "Backup not found" },
                { status: 404 }
            );
        }

        // Read backup file
        const BACKUP_DIR = join(process.cwd(), "backups");
        const filepath = join(BACKUP_DIR, filename);
        const fileBuffer = await fs.readFile(filepath);

        // Return file as download
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/gzip",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": fileBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error("Export backup error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to export backup" },
            { status: 500 }
        );
    }
}

