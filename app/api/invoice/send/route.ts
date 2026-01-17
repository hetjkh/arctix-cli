import { NextRequest, NextResponse } from "next/server";

// Services
import { sendPdfToEmailService } from "@/services/invoice/server/sendPdfToEmailService";

export async function POST(req: NextRequest) {
    try {
        const emailSent = await sendPdfToEmailService(req);

        if (emailSent) {
            return NextResponse.json(
                { message: "Email sent successfully" },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { error: "Failed to send email" },
                { status: 500 }
            );
        }
    } catch (err) {
        console.error("Email service error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to send email";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
