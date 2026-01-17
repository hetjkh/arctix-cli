import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadDocumentToCloudinary } from "@/lib/cloudinary";
import { getDb } from "@/lib/db";
import { Document, DocumentInput } from "@/models/Document";
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

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string | null;
        const category = formData.get("category") as string | null;
        const tags = formData.get("tags") as string | null;
        const invoiceId = formData.get("invoiceId") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            );
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64String = `data:${file.type};base64,${buffer.toString("base64")}`;

        // Determine resource type based on file type
        let resourceType: "auto" | "image" | "raw" | "video" = "auto";
        if (file.type.startsWith("image/")) {
            resourceType = "image";
        } else if (file.type.startsWith("video/")) {
            resourceType = "video";
        } else {
            resourceType = "raw"; // For PDFs, documents, etc.
        }

        // Upload to Cloudinary
        const uploadResult = await uploadDocumentToCloudinary(
            base64String,
            "invoify/documents",
            resourceType
        );

        // Save document to database
        const db = await getDb();
        const documentsCollection = db.collection<Document>("documents");

        const now = new Date();
        const documentData: Document = {
            userId: new ObjectId(user.userId),
            invoiceId: invoiceId ? new ObjectId(invoiceId) : undefined,
            name: name || file.name,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            description: description || undefined,
            category: category || undefined,
            tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
            version: 1,
            isCurrentVersion: true,
            uploadedBy: new ObjectId(user.userId),
            createdAt: now,
            updatedAt: now,
        };

        const result = await documentsCollection.insertOne(documentData);

        const { _id, userId, uploadedBy, ...documentResponse } = documentData;

        return NextResponse.json(
            {
                message: "Document uploaded successfully",
                document: {
                    ...documentResponse,
                    id: result.insertedId.toString(),
                    userId: userId.toString(),
                    uploadedBy: uploadedBy.toString(),
                    invoiceId: invoiceId || undefined,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Upload document error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

