import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readBackupFile, listUserBackups } from "@/services/backup/backupService";
import { restoreUserData, RestoreMode } from "@/services/backup/restoreService";

/**
 * POST /api/backup/restore
 * Restore user data from a backup
 * Body: { filename: string, mode?: "merge" | "replace" }
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

        // Check if request has a body
        let body;
        try {
            const text = await req.text();
            if (!text || text.trim() === "") {
                return NextResponse.json(
                    { error: "Request body is required" },
                    { status: 400 }
                );
            }
            body = JSON.parse(text);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { filename, mode = "merge" } = body;

        if (!filename) {
            return NextResponse.json(
                { error: "Backup filename is required" },
                { status: 400 }
            );
        }

        if (mode !== "merge" && mode !== "replace") {
            return NextResponse.json(
                { error: 'Mode must be either "merge" or "replace"' },
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

        // Read backup data
        const backupData = await readBackupFile(filename);

        // Restore user data
        const result = await restoreUserData(
            backupData,
            user.userId,
            mode as RestoreMode
        );

        if (!result.success) {
            return NextResponse.json(
                {
                    error: "Restore completed with errors",
                    result,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: "Backup restored successfully",
                result,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Restore backup error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to restore backup" },
            { status: 500 }
        );
    }
}

