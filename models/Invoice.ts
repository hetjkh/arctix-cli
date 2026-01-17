import { ObjectId } from "mongodb";
import { InvoiceType } from "@/types";

export interface InvoiceDocument extends InvoiceType {
    _id?: ObjectId;
    userId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

