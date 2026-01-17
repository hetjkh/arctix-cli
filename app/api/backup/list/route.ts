import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listUserBackups } from "@/services/backup/backupService";

/**
 * GET /api/backup/list
 * List all backups for the current user
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

        const backups = await listUserBackups(user.userId);

        return NextResponse.json(
            {
                backups,
                count: backups.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("List backups error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to list backups" },
            { status: 500 }
        );
    }
}

