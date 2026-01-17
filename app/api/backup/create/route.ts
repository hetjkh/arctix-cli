import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createBackupFile } from "@/services/backup/backupService";

/**
 * POST /api/backup/create
 * Create a new backup for the current user
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Create backup file
        const filename = await createBackupFile(user.userId, user.email);

        return NextResponse.json(
            {
                message: "Backup created successfully",
                backup: {
                    id: filename,
                    filename,
                    createdAt: new Date().toISOString(),
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Create backup error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create backup" },
            { status: 500 }
        );
    }
}

