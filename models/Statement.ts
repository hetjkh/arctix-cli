import { ObjectId } from "mongodb";
import { InvoiceType } from "@/types";

export interface StatementDocument {
    _id?: ObjectId;
    userId: ObjectId;
    clientId?: ObjectId; // Reference to client
    clientEmail: string; // Client email for filtering
    title?: string;
    billedToName?: string; // Name to display in "Billed To" section
    invoices: InvoiceType[];
    createdAt: Date;
    updatedAt: Date;
}

