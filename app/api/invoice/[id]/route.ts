import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { InvoiceDocument } from "@/models/Invoice";
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

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Invalid invoice ID" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const invoicesCollection = db.collection<InvoiceDocument>("invoices");

        const invoice = await invoicesCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!invoice) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Remove MongoDB-specific fields
        const { _id, userId, createdAt, updatedAt, ...invoiceData } = invoice;

        return NextResponse.json(
            {
                invoice: {
                    ...invoiceData,
                    id: _id!.toString(),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get invoice error:", error);
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

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: "Invalid invoice ID" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const invoicesCollection = db.collection<InvoiceDocument>("invoices");

        const result = await invoicesCollection.deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: "Invoice not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Invoice deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete invoice error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

