import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { User } from "@/models/User";
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
        const usersCollection = db.collection<User>("users");

        const userDoc = await usersCollection.findOne({
            _id: new ObjectId(user.userId),
        });

        if (!userDoc) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                user: {
                    id: userDoc._id!.toString(),
                    email: userDoc.email,
                    name: userDoc.name,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

