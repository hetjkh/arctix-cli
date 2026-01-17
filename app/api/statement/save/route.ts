import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { StatementDocument } from "@/models/Statement";
import { InvoiceType } from "@/types";
import { ObjectId } from "mongodb";

type StatementRequest = {
    invoices: InvoiceType[];
    title?: string;
    clientId?: string;
    clientEmail?: string;
    billedToName?: string;
};

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const statementData: StatementRequest = await req.json();

        if (!statementData.invoices || statementData.invoices.length === 0) {
            return NextResponse.json(
                { error: "At least one invoice is required" },
                { status: 400 }
            );
        }

        // Get client email from first invoice if not provided
        const clientEmail = statementData.clientEmail || 
            statementData.invoices[0]?.receiver?.email?.toLowerCase() || "";

        const db = await getDb();
        const statementsCollection = db.collection<StatementDocument>("statements");

        const now = new Date();

        // Create new statement
        const newStatement: StatementDocument = {
            userId: new ObjectId(user.userId),
            clientId: statementData.clientId ? new ObjectId(statementData.clientId) : undefined,
            clientEmail: clientEmail,
            title: statementData.title || "STATEMENT",
            billedToName: statementData.billedToName,
            invoices: statementData.invoices,
            createdAt: now,
            updatedAt: now,
        };

        const result = await statementsCollection.insertOne(newStatement);

        return NextResponse.json(
            {
                message: "Statement saved successfully",
                statementId: result.insertedId.toString(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Save statement error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

