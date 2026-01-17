"use client";

import React, { useState } from "react";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useFormContext } from "react-hook-form";

// ShadCn
import { toast } from "@/components/ui/use-toast";

// Helpers
import { isValidEmail } from "@/lib/helpers";

type SendPdfToEmailModalProps = {
    children: React.ReactNode;
};

const SendPdfToEmailModal = ({ children }: SendPdfToEmailModalProps) => {
    const { invoicePdf, downloadPdf } = useInvoiceContext();
    const { getValues } = useFormContext();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Option 1: User's own email credentials
    const [userEmail, setUserEmail] = useState("");
    const [userAppPassword, setUserAppPassword] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [error, setError] = useState("");

    // Handle Option 1: Send using user's email and app password
    const handleSendWithUserCredentials = async () => {
        setError("");
        
        if (!isValidEmail(userEmail)) {
            setError("Please enter a valid sender email address");
            return;
        }
        
        if (!userAppPassword || userAppPassword.trim() === "") {
            setError("Please enter your Gmail app password");
            return;
        }
        
        if (!isValidEmail(recipientEmail)) {
            setError("Please enter a valid recipient email address");
            return;
        }

        if (!invoicePdf || invoicePdf.size === 0) {
            setError("PDF not generated. Please generate the PDF first.");
            return;
        }

        setLoading(true);

        try {
            // Convert Blob to File
            const pdfFile = new File([invoicePdf], "invoice.pdf", {
                type: "application/pdf",
            });

            const formValues = getValues();
            const fd = new FormData();
            fd.append("email", recipientEmail);
            fd.append("invoicePdf", pdfFile);
            fd.append("invoiceNumber", formValues.details.invoiceNumber || "invoice");
            fd.append("senderEmail", userEmail);
            fd.append("senderAppPassword", userAppPassword);
            fd.append("senderName", formValues.sender?.name || "");

            const res = await fetch("/api/invoice/send", {
                method: "POST",
                body: fd,
            });

            if (res.ok) {
                // Success
                setUserEmail("");
                setUserAppPassword("");
                setRecipientEmail("");
                setError("");
                setOpen(false);
                // Show success message
                toast({
                    title: "Email sent successfully",
                    description: `Invoice has been sent to ${recipientEmail}`,
                });
            } else {
                const errorData = await res.json().catch(() => ({ error: "Failed to send email" }));
                const errorMsg = errorData.error || "Failed to send email. Please check your credentials.";
                setError(errorMsg);
                toast({
                    variant: "destructive",
                    title: "Failed to send email",
                    description: errorMsg,
                });
            }
        } catch (error) {
            console.error("Error sending email:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle Option 2: Download and open Gmail
    const handleOpenGmail = async () => {
        if (!invoicePdf || invoicePdf.size === 0) {
            setError("PDF not generated. Please generate the PDF first.");
            return;
        }

        try {
            // Download the PDF first
            await downloadPdf();
            
            // Get invoice number for subject
            const formValues = getValues();
            const invoiceNumber = formValues.details.invoiceNumber || "invoice";
            
            // Create mailto link (Gmail will open in compose mode)
            // Note: mailto can't attach files, but we've downloaded the PDF
            const subject = encodeURIComponent(`Invoice Ready: #${invoiceNumber}`);
            const body = encodeURIComponent(
                `Please find the invoice attached.\n\nInvoice Number: #${invoiceNumber}\n\nNote: The invoice PDF has been downloaded to your device. Please attach it manually.`
            );
            const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
            
            // Open Gmail compose
            window.open(mailtoLink, "_blank");
            
            setOpen(false);
        } catch (error) {
            console.error("Error opening Gmail:", error);
            setError("Failed to open Gmail. Please download the PDF and send it manually.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Send Invoice via Email</DialogTitle>
                    <DialogDescription>
                        Choose how you want to send the invoice
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="option1" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="option1">Use Your Email</TabsTrigger>
                        <TabsTrigger value="option2">Open Gmail</TabsTrigger>
                    </TabsList>

                    {/* Option 1: User's own email credentials */}
                    <TabsContent value="option1" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Your Gmail Address</Label>
                            <Input
                                type="email"
                                placeholder="your-email@gmail.com"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                The email address you want to send from
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Gmail App Password</Label>
                            <Input
                                type="password"
                                placeholder="Enter your Gmail app password"
                                value={userAppPassword}
                                onChange={(e) => setUserAppPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Get your app password from Google Account → Security → App passwords
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Recipient Email</Label>
                            <Input
                                type="email"
                                placeholder="recipient@example.com"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500">{error}</div>
                        )}

                        <BaseButton
                            tooltipLabel="Send invoice using your email"
                            loading={loading}
                            loadingText="Sending..."
                            onClick={handleSendWithUserCredentials}
                            className="w-full"
                        >
                            Send Email
                        </BaseButton>
                    </TabsContent>

                    {/* Option 2: Open Gmail */}
                    <TabsContent value="option2" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                This will download the invoice PDF and open Gmail in a new tab. 
                                You can then attach the downloaded PDF and send it from your own Gmail account.
                            </p>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500">{error}</div>
                        )}

                        <BaseButton
                            tooltipLabel="Download PDF and open Gmail"
                            onClick={handleOpenGmail}
                            className="w-full"
                        >
                            Download & Open Gmail
                        </BaseButton>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default SendPdfToEmailModal;
