import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { InvoiceDocument } from "@/models/Invoice";
import { InvoiceType } from "@/types";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const invoiceData: InvoiceType = await req.json();

        const db = await getDb();
        const invoicesCollection = db.collection<InvoiceDocument>("invoices");

        // Check if invoice with same number exists for this user
        const existingInvoice = await invoicesCollection.findOne({
            userId: new ObjectId(user.userId),
            "details.invoiceNumber": invoiceData.details.invoiceNumber,
        });

        const now = new Date();

        if (existingInvoice) {
            // Update existing invoice
            const updatedInvoice: Partial<InvoiceDocument> = {
                ...invoiceData,
                userId: new ObjectId(user.userId),
                updatedAt: now,
            };

            await invoicesCollection.updateOne(
                { _id: existingInvoice._id },
                { $set: updatedInvoice }
            );

            return NextResponse.json(
                {
                    message: "Invoice updated successfully",
                    invoiceId: existingInvoice._id!.toString(),
                },
                { status: 200 }
            );
        } else {
            // Create new invoice
            const newInvoice: InvoiceDocument = {
                ...invoiceData,
                userId: new ObjectId(user.userId),
                createdAt: now,
                updatedAt: now,
            };

            const result = await invoicesCollection.insertOne(newInvoice);

            return NextResponse.json(
                {
                    message: "Invoice saved successfully",
                    invoiceId: result.insertedId.toString(),
                },
                { status: 201 }
            );
        }
    } catch (error) {
        console.error("Save invoice error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

