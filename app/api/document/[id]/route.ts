import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Document } from "@/models/Document";
import { deleteFromCloudinary } from "@/lib/cloudinary";
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
        const documentsCollection = db.collection<Document>("documents");

        const document = await documentsCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!document) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        // Get version history if this is a versioned document
        let versions: any[] = [];
        if (document.parentDocumentId || document.version > 1) {
            const parentId = document.parentDocumentId || document._id;
            const versionDocs = await documentsCollection
                .find({
                    $or: [
                        { _id: parentId },
                        { parentDocumentId: parentId },
                    ],
                    userId: new ObjectId(user.userId),
                })
                .sort({ version: -1 })
                .toArray();

            versions = versionDocs.map((v) => {
                const { _id, userId, invoiceId, uploadedBy, parentDocumentId, ...vData } = v;
                return {
                    ...vData,
                    id: _id!.toString(),
                    userId: userId.toString(),
                    invoiceId: invoiceId?.toString(),
                    uploadedBy: uploadedBy.toString(),
                    parentDocumentId: parentDocumentId?.toString(),
                };
            });
        }

        const { _id, userId, invoiceId, uploadedBy, parentDocumentId, ...docData } = document;

        return NextResponse.json(
            {
                document: {
                    ...docData,
                    id: _id!.toString(),
                    userId: userId.toString(),
                    invoiceId: invoiceId?.toString(),
                    uploadedBy: uploadedBy.toString(),
                    parentDocumentId: parentDocumentId?.toString(),
                },
                versions,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get document error:", error);
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
        const documentsCollection = db.collection<Document>("documents");

        const document = await documentsCollection.findOne({
            _id: new ObjectId(id),
            userId: new ObjectId(user.userId),
        });

        if (!document) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        // Delete from Cloudinary
        if (document.publicId) {
            await deleteFromCloudinary(document.publicId);
        }

        // Delete from database
        await documentsCollection.deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json(
            { message: "Document deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete document error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

