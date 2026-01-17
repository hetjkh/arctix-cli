import { ObjectId } from "mongodb";

export interface User {
    _id?: ObjectId;
    email: string;
    password: string; // hashed
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserInput {
    email: string;
    password: string;
    name?: string;
}

