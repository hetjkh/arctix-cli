import { ObjectId } from "mongodb";

export interface Client {
    _id?: ObjectId;
    userId: ObjectId;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    country?: string;
    address?: string;
    zipCode?: string;
    notes?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ClientInput {
    name: string;
    email: string;
    phone?: string;
    city?: string;
    country?: string;
    address?: string;
    zipCode?: string;
    notes?: string;
    tags?: string[];
}

