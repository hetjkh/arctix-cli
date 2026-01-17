import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

/**
 * POST /api/upload/cloudinary
 * Upload an image to Cloudinary
 */
export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        
        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { base64String, folder } = body;

        if (!base64String) {
            return NextResponse.json(
                { error: "Base64 string is required" },
                { status: 400 }
            );
        }

        const result = await uploadToCloudinary(
            base64String,
            folder || "invoify"
        );

        return NextResponse.json(
            { url: result.secure_url, public_id: result.public_id },
            { status: 200 }
        );
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload image" },
            { status: 500 }
        );
    }
}

