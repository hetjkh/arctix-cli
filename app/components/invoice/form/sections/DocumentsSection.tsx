"use client";

import { useState, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Subheading } from "@/app/components";
import DocumentList from "@/app/components/document/DocumentList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DocumentsSection = () => {
    const { control } = useFormContext();
    const invoiceNumber = useWatch({
        name: "details.invoiceNumber",
        control,
    });

    // Get invoice ID from saved invoices if invoice exists
    const [invoiceId, setInvoiceId] = useState<string | undefined>();

    useEffect(() => {
        // Try to get invoice ID from saved invoices
        const fetchInvoiceId = async () => {
            if (invoiceNumber) {
                try {
                    const response = await fetch("/api/invoice/list");
                    if (response.ok) {
                        const data = await response.json();
                        const invoice = data.invoices?.find(
                            (inv: any) => inv.details.invoiceNumber === invoiceNumber
                        );
                        if (invoice?.id) {
                            setInvoiceId(invoice.id);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching invoice ID:", error);
                }
            }
        };

        fetchInvoiceId();
    }, [invoiceNumber]);

    return (
        <section className="space-y-4">
            <Subheading>Attached Documents</Subheading>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Attach receipts, contracts, or other documents to this invoice.
                        {!invoiceId && (
                            <span className="block mt-2 text-xs">
                                Note: Save the invoice first to attach documents permanently.
                            </span>
                        )}
                    </p>
                    <DocumentList invoiceId={invoiceId} showUpload={true} />
                </CardContent>
            </Card>
        </section>
    );
};

export default DocumentsSection;

