// Variables
import { EXPORT_INVOICE_API } from "@/lib/variables";

// Types
import { ExportTypes, InvoiceType } from "@/types";

// Services
import { saveFileToDirectory } from "./downloadToDirectory";

// ShadCn
import { toast } from "@/components/ui/use-toast";

/**
 * Export an invoice by sending a POST request to the server and initiating the download.
 *
 * @param {ExportTypes} exportAs - The format in which to export the invoice (e.g., JSON, CSV).
 * @param {InvoiceType} formValues - The invoice form data to be exported.
 * @throws {Error} If there is an error during the export process.
 * @returns {Promise<void>} A promise that resolves when the export is completed.
 */
export const exportInvoice = async (
    exportAs: ExportTypes,
    formValues: InvoiceType
) => {
    return fetch(`${EXPORT_INVOICE_API}?format=${exportAs}`, {
        method: "POST",
        body: JSON.stringify(formValues),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => res.blob())
        .then(async (blob) => {
            // Get invoice number from form values
            const invoiceNumber = formValues.details.invoiceNumber || "invoice";
            // Sanitize filename (remove invalid characters)
            const sanitizedInvoiceNumber = invoiceNumber.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            const filename = `${sanitizedInvoiceNumber}.${exportAs.toLowerCase()}`;
            
            // Try to save to preferred directory first
            const saved = await saveFileToDirectory(blob, filename);
            
            if (!saved) {
                // Fallback to default browser download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
            }
            
            // Show success message
            toast({
                variant: "default",
                title: "Export successful",
                description: `Invoice ${invoiceNumber} has been exported as ${exportAs} successfully`,
            });
        })
        .catch((error) => {
            console.error("Error downloading:", error);
            toast({
                variant: "destructive",
                title: "Export failed",
                description: "Something went wrong while exporting the invoice. Please try again.",
            });
        });
};
