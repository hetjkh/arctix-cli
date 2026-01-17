import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { StatementDocument } from "@/models/Statement";
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

        const { _id, userId, ...statementData } = statement;

        return NextResponse.json(
            {
                statement: {
                    ...statementData,
                    id: _id!.toString(),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get statement error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

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

        await statementsCollection.deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json(
            { message: "Statement deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete statement error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

