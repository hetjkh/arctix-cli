"use client";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Form } from "@/components/ui/form";

// Components
import { InvoiceActions, InvoiceForm } from "@/app/components";
import InvoiceSettingsPanel from "@/app/components/invoice/settings/InvoiceSettingsPanel";

// Context
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { useInvoiceSettings } from "@/contexts/InvoiceSettingsContext";

// Types
import { InvoiceType } from "@/types";

const InvoiceMain = () => {
    const { handleSubmit } = useFormContext<InvoiceType>();

    // Get the needed values from invoice context
    const { onFormSubmit } = useInvoiceContext();
    const { isSettingsOpen, closeSettings } = useInvoiceSettings();

    return (
        <>
            <Form {...useFormContext<InvoiceType>()}>
                <form
                    onSubmit={handleSubmit(onFormSubmit, (err) => {
                        console.log(err);
                    })}
                >
                    <div className="flex flex-wrap">
                        <InvoiceForm />
                        <InvoiceActions />
                    </div>
                </form>
            </Form>
            <InvoiceSettingsPanel isOpen={isSettingsOpen} onClose={closeSettings} />
        </>
    );
};

export default InvoiceMain;
