import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Client } from "@/models/Client";
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
        const clientsCollection = db.collection<Client>("clients");

        const clients = await clientsCollection
            .find({ userId: new ObjectId(user.userId) })
            .sort({ name: 1 })
            .toArray();

        // Remove MongoDB-specific fields and convert to plain objects
        const formattedClients = clients.map((client) => {
            const { _id, userId, ...clientData } = client;
            return {
                ...clientData,
                id: _id!.toString(),
            };
        });

        return NextResponse.json(
            { clients: formattedClients },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get clients error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

