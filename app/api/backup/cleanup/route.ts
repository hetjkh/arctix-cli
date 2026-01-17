import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cleanupOldBackups } from "@/services/backup/backupService";

/**
 * DELETE /api/backup/cleanup?keep=10
 * Cleanup old backups, keeping only the most recent N backups
 */
export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const keepCount = parseInt(searchParams.get("keep") || "10", 10);

        if (isNaN(keepCount) || keepCount < 1) {
            return NextResponse.json(
                { error: "Keep count must be a positive number" },
                { status: 400 }
            );
        }

        const deletedCount = await cleanupOldBackups(user.userId, keepCount);

        return NextResponse.json(
            {
                message: `Cleaned up ${deletedCount} old backup(s)`,
                deletedCount,
                kept: keepCount,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Cleanup backups error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to cleanup backups" },
            { status: 500 }
        );
    }
}

