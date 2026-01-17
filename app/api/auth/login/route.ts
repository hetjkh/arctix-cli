import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { generateToken, setAuthCookie } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const usersCollection = db.collection<User>("users");

        // Find user
        const user = await usersCollection.findOne({ email: email.toLowerCase() });
        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Generate token
        const token = generateToken({
            userId: user._id!.toString(),
            email: user.email,
        });

        // Create response
        const response = NextResponse.json(
            {
                message: "Login successful",
                user: {
                    id: user._id!.toString(),
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 200 }
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
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

