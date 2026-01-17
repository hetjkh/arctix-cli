import { NextRequest } from "next/server";

// Nodemailer
import nodemailer, { SendMailOptions } from "nodemailer";

// React-email
import { render } from "@react-email/render";

// Components
import { SendPdfEmail } from "@/app/components";

// Helpers
import { fileToBuffer } from "@/lib/helpers";

// Variables
import { NODEMAILER_EMAIL, NODEMAILER_PW } from "@/lib/variables";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: NODEMAILER_EMAIL,
        pass: NODEMAILER_PW,
    },
});

// Check if email credentials are configured
const isEmailConfigured = () => {
    return !!(NODEMAILER_EMAIL && NODEMAILER_PW);
};

/**
 * Send a PDF as an email attachment.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {Promise<boolean>} A Promise that resolves to a boolean, indicating whether the email was sent successfully.
 * @throws {Error} Throws an error if there is an issue with sending the email.
 */
export async function sendPdfToEmailService(
    req: NextRequest
): Promise<boolean> {
    const fd = await req.formData();

    // Get form data values
    const email = fd.get("email") as string;
    const invoicePdf = fd.get("invoicePdf") as File;
    const invoiceNumber = fd.get("invoiceNumber") as string;
    const senderEmail = (fd.get("senderEmail") as string) || "";
    const senderAppPassword = (fd.get("senderAppPassword") as string) || "";
    const senderName = (fd.get("senderName") as string) || "";

    // Validate required fields
    if (!email || typeof email !== "string" || email.trim() === "") {
        throw new Error("Recipient email address is required");
    }

    if (!invoicePdf || !(invoicePdf instanceof File)) {
        throw new Error("Invoice PDF file is required");
    }

    if (invoicePdf.size === 0) {
        throw new Error("Invoice PDF file is empty");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid recipient email address format");
    }

    // Use user-provided credentials if available, otherwise use default
    const useUserCredentials = senderEmail && senderAppPassword;
    
    if (useUserCredentials) {
        // Validate user email format
        if (!emailRegex.test(senderEmail)) {
            throw new Error("Invalid sender email address format");
        }
    } else {
        // Check if default email service is configured
        if (!isEmailConfigured()) {
            throw new Error(
                "Email service not configured. Please provide your email and app password, or contact the administrator."
            );
        }
    }

    // Create transporter with user credentials or default
    const emailTransporter = useUserCredentials
        ? nodemailer.createTransport({
              service: "gmail",
              auth: {
                  user: senderEmail,
                  pass: senderAppPassword,
              },
          })
        : transporter;

    // Get email html content
    const emailHTML = render(SendPdfEmail({ invoiceNumber: invoiceNumber || "invoice" }));

    // Convert file to buffer
    const invoiceBuffer = await fileToBuffer(invoicePdf);

    try {
        const fromName = senderName && senderName.trim() !== "" 
            ? senderName.trim() 
            : "Invoify";
        
        const fromEmail = useUserCredentials ? senderEmail : NODEMAILER_EMAIL!;

        const mailOptions: SendMailOptions = {
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject: `Invoice Ready: #${invoiceNumber || "invoice"}`,
            html: emailHTML,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: invoiceBuffer,
                },
            ],
        };

        await emailTransporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to send email: ${errorMessage}`);
    }
}
