import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { StatementDocument } from "@/models/Statement";
import { generateStatementService } from "@/services/invoice/server/generateStatementService";
import { ObjectId } from "mongodb";

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
        const db = await getDb();
        const statementsCollection = db.collection<StatementDocument>("statements");

        const statement = await statementsCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!statement) {
            return NextResponse.json(
                { error: "Statement not found" },
                { status: 404 }
            );
        }

        // Generate PDF using the existing service
        // Create a new request with the statement data
        const requestBody = JSON.stringify({
            invoices: statement.invoices,
            title: statement.title || "STATEMENT",
            billedToName: statement.billedToName,
        });

        const request = new NextRequest(new URL("/api/invoice/statement", req.url), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: requestBody,
        });

        return await generateStatementService(request);
    } catch (error) {
        console.error("Download statement error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

