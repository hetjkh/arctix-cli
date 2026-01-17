import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Client, ClientInput } from "@/models/Client";
import { ClientSchema } from "@/lib/schemas";
import { InvoiceDocument } from "@/models/Invoice";
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
        const clientsCollection = db.collection<Client>("clients");

        const client = await clientsCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        // Get all invoices for this client
        const invoicesCollection = db.collection<InvoiceDocument>("invoices");
        const invoices = await invoicesCollection
            .find({
                userId: new ObjectId(user.userId),
                "receiver.email": client.email.toLowerCase(),
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Get all statements for this client
        const statementsCollection = db.collection<StatementDocument>("statements");
        const statements = await statementsCollection
            .find({
                userId: new ObjectId(user.userId),
                clientEmail: client.email.toLowerCase(),
            })
            .sort({ createdAt: -1 })
            .toArray();

        const { _id, userId, ...clientData } = client;
        const formattedInvoices = invoices.map((invoice) => {
            const { _id: invoiceId, userId: invoiceUserId, ...invoiceData } = invoice;
            return {
                ...invoiceData,
                id: invoiceId!.toString(),
            };
        });

        const formattedStatements = statements.map((statement) => {
            const { _id: statementId, userId: statementUserId, ...statementData } = statement;
            return {
                ...statementData,
                id: statementId!.toString(),
            };
        });

        const response = NextResponse.json(
            {
                client: {
                    ...clientData,
                    id: _id!.toString(),
                },
                invoices: formattedInvoices,
                statements: formattedStatements,
            },
            { status: 200 }
        );
        
        // Prevent caching to ensure fresh data
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        
        return response;
    } catch (error) {
        console.error("Get client error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(
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
        const clientData: ClientInput = await req.json();

        // Validate input
        const validationResult = ClientSchema.safeParse(clientData);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const db = await getDb();
        const clientsCollection = db.collection<Client>("clients");

        // Check if client exists and belongs to user
        const existingClient = await clientsCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!existingClient) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        // Check if email is being changed and if new email already exists
        if (clientData.email.toLowerCase() !== existingClient.email.toLowerCase()) {
            const emailExists = await clientsCollection.findOne({
                userId: new ObjectId(user.userId),
                email: clientData.email.toLowerCase(),
            });

            if (emailExists) {
                return NextResponse.json(
                    { error: "Client with this email already exists" },
                    { status: 409 }
                );
            }
        }

        const updatedClient: Partial<Client> = {
            ...validationResult.data,
            email: validationResult.data.email.toLowerCase(),
            updatedAt: new Date(),
        };

        await clientsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedClient }
        );

        const updated = await clientsCollection.findOne({
            _id: new ObjectId(id),
        });

        const { _id, userId, ...clientResponse } = updated!;

        return NextResponse.json(
            {
                message: "Client updated successfully",
                client: {
                    ...clientResponse,
                    id: _id!.toString(),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update client error:", error);
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
        const clientsCollection = db.collection<Client>("clients");

        const client = await clientsCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        await clientsCollection.deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json(
            { message: "Client deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete client error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

