import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface JWTPayload {
    userId: string;
    email: string;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Get the current user from the request cookies
 */
export async function getCurrentUser(req?: NextRequest): Promise<JWTPayload | null> {
    try {
        let token: string | undefined;

        if (req) {
            // Server-side: get from request cookies
            token = req.cookies.get("token")?.value;
        } else {
            // Server component: get from next/headers
            const cookieStore = await cookies();
            token = cookieStore.get("token")?.value;
        }

        if (!token) {
            return null;
        }

        return verifyToken(token);
    } catch {
        return null;
    }
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(token: string) {
    // This will be used in API routes
    return {
        name: "token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    };
}

