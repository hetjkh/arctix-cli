import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readBackupFile, deleteBackupFile, listUserBackups } from "@/services/backup/backupService";

/**
 * GET /api/backup/[id]
 * Get backup details by filename
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const filename = decodeURIComponent(id);

        // Verify backup belongs to user
        const backups = await listUserBackups(user.userId);
        const backup = backups.find((b) => b.filename === filename);

        if (!backup) {
            return NextResponse.json(
                { error: "Backup not found" },
                { status: 404 }
            );
        }

        // Read backup data
        const backupData = await readBackupFile(filename);

        return NextResponse.json(
            {
                backup: {
                    ...backup,
                    metadata: backupData.metadata,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Get backup error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get backup" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/backup/[id]
 * Delete a backup file
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const filename = decodeURIComponent(id);

        // Verify backup belongs to user
        const backups = await listUserBackups(user.userId);
        const backup = backups.find((b) => b.filename === filename);

        if (!backup) {
            return NextResponse.json(
                { error: "Backup not found" },
                { status: 404 }
            );
        }

        // Delete backup file
        await deleteBackupFile(filename);

        return NextResponse.json(
            {
                message: "Backup deleted successfully",
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Delete backup error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete backup" },
            { status: 500 }
        );
    }
}

