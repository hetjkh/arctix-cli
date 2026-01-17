import { ObjectId } from "mongodb";
import { InvoiceType } from "@/types";

// UserDefaults type - excludes items/line items from invoice details
export interface UserDefaults {
    _id?: ObjectId;
    userId: ObjectId;
    name: string; // Name of the preset
    sender: InvoiceType["sender"];
    receiver: InvoiceType["receiver"];
    details: Omit<InvoiceType["details"], "items"> & {
        // Explicitly exclude items
        items?: never;
    };
    createdAt: Date;
    updatedAt: Date;
}

