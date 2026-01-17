import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { generateToken, setAuthCookie } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const usersCollection = db.collection<User>("users");

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser: Omit<User, "_id"> = {
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name || "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser as User);

        // Generate token
        const token = generateToken({
            userId: result.insertedId.toString(),
            email: newUser.email,
        });

        // Create response
        const response = NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: result.insertedId.toString(),
                    email: newUser.email,
                    name: newUser.name,
                },
            },
            { status: 201 }
        );

        // Set cookie
        const cookie = setAuthCookie(token);
        response.cookies.set(cookie.name, cookie.value, {
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite,
            maxAge: cookie.maxAge,
            path: cookie.path,
        });

        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

