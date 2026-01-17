// ShadCn
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";

const useToasts = () => {
    type SendErrorType = {
        email: string;
        sendPdfToMail: (email: string) => void;
    };

    const newInvoiceSuccess = () => {
        toast({
            variant: "default",
            title: "Generated new invoice",
            description: "Successfully created a new invoice",
        });
    };

    const pdfGenerationSuccess = () => {
        toast({
            variant: "default",
            title: "Your invoice has been generated!",
            description:
                "You can preview, download, or save it from the actions tab",
        });
    };

    const saveInvoiceSuccess = () => {
        toast({
            variant: "default",
            title: "Saved Invoice",
            description: "Your invoice details are saved now",
        });
    };

    const modifiedInvoiceSuccess = () => {
        toast({
            variant: "default",
            title: "Modified Invoice",
            description: "Successfully modified your invoice",
        });
    };

    const sendPdfSuccess = () => {
        toast({
            variant: "default",
            title: "Email sent",
            description: "Your invoice has been sent to the specified email",
        });
    };

    const sendPdfError = ({ email, sendPdfToMail }: SendErrorType) => {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Something went wrong. Try again in a moment",
            action: (
                <ToastAction
                    onClick={() => sendPdfToMail(email)}
                    altText="Try again"
                >
                    Try again
                </ToastAction>
            ),
        });
    };

    const importInvoiceError = () => {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Something went wrong importing the invoice. Make sure the file is a valid Invoify JSON or Excel export",
        });
    };

    const importInvoiceSuccess = () => {
        toast({
            variant: "default",
            title: "Invoice imported",
            description: "Successfully imported invoice data including logo and signature",
        });
    };

    const downloadSuccess = (filename?: string) => {
        toast({
            variant: "default",
            title: "Download successful",
            description: filename 
                ? `Invoice ${filename} has been downloaded successfully`
                : "Invoice has been downloaded successfully",
        });
    };

    return {
        newInvoiceSuccess,
        pdfGenerationSuccess,
        saveInvoiceSuccess,
        modifiedInvoiceSuccess,
        sendPdfSuccess,
        sendPdfError,
        importInvoiceError,
        importInvoiceSuccess,
        downloadSuccess,
    };
};

export default useToasts;
