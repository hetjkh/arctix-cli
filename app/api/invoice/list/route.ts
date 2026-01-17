import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { InvoiceDocument } from "@/models/Invoice";
import { SHORT_DATE_OPTIONS } from "@/lib/variables";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const db = await getDb();
        const invoicesCollection = db.collection<InvoiceDocument>("invoices");

        const invoices = await invoicesCollection
            .find({ userId: new ObjectId(user.userId) })
            .sort({ updatedAt: -1 })
            .toArray();

        // Remove MongoDB-specific fields and convert to plain objects
        const formattedInvoices = invoices.map((invoice) => {
            const { _id, userId, createdAt, updatedAt, ...invoiceData } = invoice;
            // Format updatedAt for display
            const updatedAtString = updatedAt 
                ? new Date(updatedAt).toLocaleDateString("en-US", SHORT_DATE_OPTIONS)
                : new Date().toLocaleDateString("en-US", SHORT_DATE_OPTIONS);
            
            return {
                ...invoiceData,
                id: _id!.toString(),
                details: {
                    ...invoiceData.details,
                    updatedAt: updatedAtString,
                },
            };
        });

        const response = NextResponse.json(
            { invoices: formattedInvoices },
            { status: 200 }
        );
        
        // Prevent caching to ensure fresh data
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        
        return response;
    } catch (error) {
        console.error("Get invoices error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

