import { v2 as cloudinary } from "cloudinary";

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dvrko1y0a",
    api_key: process.env.CLOUDINARY_API_KEY || "718679757661864",
    api_secret: process.env.CLOUDINARY_API_SECRET || "U7urAnAcBIyXSeGgkJL6ylv0uGo",
});

export default cloudinary;

/**
 * Upload an image to Cloudinary
 * @param base64String - Base64 encoded image string
 * @param folder - Folder path in Cloudinary (optional)
 * @returns Promise with upload result containing secure_url
 */
export async function uploadToCloudinary(
    base64String: string,
    folder: string = "invoify"
): Promise<{ secure_url: string; public_id: string }> {
    try {
        // Check if it's already a Cloudinary URL
        if (base64String.startsWith("http://") || base64String.startsWith("https://")) {
            // Extract public_id from existing Cloudinary URL if possible
            const urlParts = base64String.split("/");
            const publicIdIndex = urlParts.findIndex(part => part === "upload") + 2;
            if (publicIdIndex > 1 && urlParts[publicIdIndex]) {
                const publicId = urlParts.slice(publicIdIndex).join("/").split(".")[0];
                return {
                    secure_url: base64String,
                    public_id: publicId,
                };
            }
            return {
                secure_url: base64String,
                public_id: "",
            };
        }

        // Upload new image
        const result = await cloudinary.uploader.upload(base64String, {
            folder: folder,
            resource_type: "image",
        });

        return {
            secure_url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error("Failed to upload image to Cloudinary");
    }
}

/**
 * Upload a document (PDF, etc.) to Cloudinary
 * @param base64String - Base64 encoded file string
 * @param folder - Folder path in Cloudinary (optional)
 * @param resourceType - Resource type: "auto", "image", "raw", "video" (default: "auto")
 * @returns Promise with upload result containing secure_url
 */
export async function uploadDocumentToCloudinary(
    base64String: string,
    folder: string = "invoify/documents",
    resourceType: "auto" | "image" | "raw" | "video" = "auto"
): Promise<{ secure_url: string; public_id: string }> {
    try {
        // Check if it's already a Cloudinary URL
        if (base64String.startsWith("http://") || base64String.startsWith("https://")) {
            const urlParts = base64String.split("/");
            const publicIdIndex = urlParts.findIndex(part => part === "upload") + 2;
            if (publicIdIndex > 1 && urlParts[publicIdIndex]) {
                const publicId = urlParts.slice(publicIdIndex).join("/").split(".")[0];
                return {
                    secure_url: base64String,
                    public_id: publicId,
                };
            }
            return {
                secure_url: base64String,
                public_id: "",
            };
        }

        // Upload document
        const result = await cloudinary.uploader.upload(base64String, {
            folder: folder,
            resource_type: resourceType,
        });

        return {
            secure_url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error("Cloudinary document upload error:", error);
        throw new Error("Failed to upload document to Cloudinary");
    }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        // Don't throw - deletion failures shouldn't break the flow
    }
}

