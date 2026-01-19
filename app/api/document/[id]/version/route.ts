import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadDocumentToCloudinary } from "@/lib/cloudinary";
import { getDb } from "@/lib/db";
import { Document } from "@/models/Document";
import { ObjectId } from "mongodb";

export async function POST(
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
        const documentsCollection = db.collection<Document>("documents");

        // Get original document
        const originalDoc = await documentsCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!originalDoc) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        // Get form data
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const description = formData.get("description") as string | null;

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

        // Determine resource type
        let resourceType: "auto" | "image" | "raw" | "video" = "auto";
        if (file.type.startsWith("image/")) {
            resourceType = "image";
        } else if (file.type.startsWith("video/")) {
            resourceType = "video";
        } else {
            resourceType = "raw";
        }

        // Upload new version to Cloudinary
        const uploadResult = await uploadDocumentToCloudinary(
            base64String,
            "invoify/documents",
            resourceType
        );

        // Determine parent document ID
        const parentDocumentId = originalDoc.parentDocumentId || originalDoc._id!;

        // Mark all previous versions as not current
        await documentsCollection.updateMany(
            {
                $and: [
                    {
                        $or: [
                            { _id: parentDocumentId },
                            { parentDocumentId: parentDocumentId },
                        ],
                    },
                    { userId: new ObjectId(user.userId) },
                ],
            },
            { $set: { isCurrentVersion: false } }
        );

        // Get next version number
        const versionDocs = await documentsCollection
            .find({
                $and: [
                    {
                        $or: [
                            { _id: parentDocumentId },
                            { parentDocumentId: parentDocumentId },
                        ],
                    },
                    { userId: new ObjectId(user.userId) },
                ],
            })
            .sort({ version: -1 })
            .limit(1)
            .toArray();

        const nextVersion = versionDocs.length > 0
            ? (versionDocs[0].version || 1) + 1
            : originalDoc.version + 1;

        // Create new version
        const now = new Date();
        const newVersion: Document = {
            userId: new ObjectId(user.userId),
            invoiceId: originalDoc.invoiceId,
            name: originalDoc.name,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            description: description || originalDoc.description,
            category: originalDoc.category,
            tags: originalDoc.tags,
            version: nextVersion,
            parentDocumentId: parentDocumentId,
            isCurrentVersion: true,
            uploadedBy: new ObjectId(user.userId),
            createdAt: now,
            updatedAt: now,
        };

        const result = await documentsCollection.insertOne(newVersion);

        const { _id, userId, uploadedBy, ...docData } = newVersion;

        return NextResponse.json(
            {
                message: "Document version uploaded successfully",
                document: {
                    ...docData,
                    id: result.insertedId.toString(),
                    userId: userId.toString(),
                    uploadedBy: uploadedBy.toString(),
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Upload document version error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

