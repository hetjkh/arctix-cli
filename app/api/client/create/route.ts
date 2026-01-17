import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Client, ClientInput } from "@/models/Client";
import { ClientSchema } from "@/lib/schemas";
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

        // Check if client with same email exists for this user
        const existingClient = await clientsCollection.findOne({
            userId: new ObjectId(user.userId),
            email: clientData.email.toLowerCase(),
        });

        if (existingClient) {
            return NextResponse.json(
                { error: "Client with this email already exists" },
                { status: 409 }
            );
        }

        const now = new Date();
        const newClient: Client = {
            ...validationResult.data,
            email: validationResult.data.email.toLowerCase(),
            userId: new ObjectId(user.userId),
            createdAt: now,
            updatedAt: now,
        };

        const result = await clientsCollection.insertOne(newClient);

        const { _id, userId, ...clientResponse } = newClient;

        return NextResponse.json(
            {
                message: "Client created successfully",
                client: {
                    ...clientResponse,
                    id: result.insertedId.toString(),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create client error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

