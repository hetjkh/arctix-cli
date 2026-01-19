import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Document } from "@/models/Document";
import { ObjectId } from "mongodb";

/**
 * GET /api/document/[id]/download
 * Download a document file from Cloudinary
 */
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

        // Get document and verify ownership
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

        // Fetch the file from Cloudinary
        const cloudinaryUrl = document.fileUrl;
        
        // For Cloudinary raw files, we need to ensure we get the original file
        // If the URL contains transformations, we need to reconstruct it using the public_id
        let downloadUrl = cloudinaryUrl;
        
        if (cloudinaryUrl.includes("cloudinary.com") && document.publicId) {
            // Extract base URL (everything before /upload/)
            const baseUrlMatch = cloudinaryUrl.match(/^(https?:\/\/res\.cloudinary\.com\/[^\/]+)/);
            if (baseUrlMatch) {
                const baseUrl = baseUrlMatch[1];
                const resourceType = cloudinaryUrl.includes("/raw/") ? "raw" : "image";
                
                // Get file extension from fileName
                const fileExtension = document.fileName.split(".").pop() || "";
                
                // Construct URL to get raw file without transformations
                // Use fl_attachment to force download
                if (resourceType === "raw") {
                    // For raw files, use: /raw/upload/fl_attachment/{public_id}.{ext}
                    downloadUrl = `${baseUrl}/raw/upload/fl_attachment/${document.publicId}${fileExtension ? `.${fileExtension}` : ""}`;
                } else {
                    // For images, try to get original
                    downloadUrl = `${baseUrl}/image/upload/fl_attachment/${document.publicId}${fileExtension ? `.${fileExtension}` : ""}`;
                }
            }
        }

        // Fetch the file
        let response = await fetch(downloadUrl);
        
        // If the modified URL fails, try the original URL
        if (!response.ok) {
            response = await fetch(cloudinaryUrl);
        }
        
        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch document from Cloudinary" },
                { status: 500 }
            );
        }

        const fileBuffer = await response.arrayBuffer();
        
        // Get content type from response or use stored file type
        let contentType = response.headers.get("content-type");
        if (!contentType || contentType === "application/octet-stream") {
            contentType = document.fileType || "application/octet-stream";
        }
        
        // Sanitize filename - preserve extension
        const sanitizedFileName = document.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${sanitizedFileName}"`,
                "Content-Length": fileBuffer.byteLength.toString(),
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("Download document error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

