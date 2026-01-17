import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Document } from "@/models/Document";
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

        const { searchParams } = new URL(req.url);
        const invoiceId = searchParams.get("invoiceId");
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const includeVersions = searchParams.get("includeVersions") === "true";

        const db = await getDb();
        const documentsCollection = db.collection<Document>("documents");

        // Build query
        const query: any = {
            userId: new ObjectId(user.userId),
        };

        if (invoiceId) {
            query.invoiceId = new ObjectId(invoiceId);
        }

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { fileName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } },
            ];
        }

        // If not including versions, only get current versions
        if (!includeVersions) {
            query.isCurrentVersion = true;
        }

        const documents = await documentsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        // Format documents
        const formattedDocuments = documents.map((doc) => {
            const { _id, userId, invoiceId, uploadedBy, parentDocumentId, ...docData } = doc;
            return {
                ...docData,
                id: _id!.toString(),
                userId: userId.toString(),
                invoiceId: invoiceId?.toString(),
                uploadedBy: uploadedBy.toString(),
                parentDocumentId: parentDocumentId?.toString(),
            };
        });

        return NextResponse.json(
            { documents: formattedDocuments },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get documents error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

