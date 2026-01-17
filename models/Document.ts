import { ObjectId } from "mongodb";

export interface Document {
    _id?: ObjectId;
    userId: ObjectId;
    invoiceId?: ObjectId; // Optional - documents can be standalone or attached to invoices
    name: string;
    fileName: string;
    fileType: string; // MIME type
    fileSize: number; // in bytes
    fileUrl: string; // Cloudinary URL
    publicId: string; // Cloudinary public ID
    description?: string;
    category?: string; // e.g., "receipt", "contract", "invoice", "other"
    tags?: string[];
    version: number;
    parentDocumentId?: ObjectId; // For versioning - links to original document
    isCurrentVersion: boolean;
    uploadedBy: ObjectId; // User who uploaded this version
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentInput {
    name: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    publicId: string;
    description?: string;
    category?: string;
    tags?: string[];
    invoiceId?: string;
}

