import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initializeIndexes } from "@/lib/db";

/**
 * API endpoint to manually initialize database indexes.
 * This can be called once to set up indexes for better query performance.
 * 
 * GET /api/db/init-indexes
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

        await initializeIndexes();

        return NextResponse.json(
            { 
                message: "Database indexes initialized successfully",
                note: "Indexes are created in the background and may take a few moments to complete."
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Initialize indexes error:", error);
        return NextResponse.json(
            { 
                error: "Failed to initialize indexes",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

