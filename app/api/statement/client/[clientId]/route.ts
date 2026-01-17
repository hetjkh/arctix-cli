import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { StatementDocument } from "@/models/Statement";
import { ObjectId } from "mongodb";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { clientId } = await params;
        const db = await getDb();
        
        // Get client to find their email
        const clientsCollection = db.collection("clients");
        const client = await clientsCollection.findOne({
            _id: new ObjectId(clientId),
            userId: new ObjectId(user.userId),
        });

        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        // Get statements for this client by email
        const statementsCollection = db.collection<StatementDocument>("statements");
        const statements = await statementsCollection
            .find({
                userId: new ObjectId(user.userId),
                clientEmail: client.email.toLowerCase(),
            })
            .sort({ createdAt: -1 })
            .toArray();

        const formattedStatements = statements.map((statement) => {
            const { _id, userId, ...statementData } = statement;
            return {
                ...statementData,
                id: _id!.toString(),
            };
        });

        return NextResponse.json(
            { statements: formattedStatements },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get client statements error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

