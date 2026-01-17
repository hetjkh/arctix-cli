"use client";

import { useState, useEffect } from "react";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Components
import { SavedPaymentInfoList } from "@/app/components";

// Variables
import { LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

type PaymentInfoType = {
    id: string;
    name: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban?: string;
    swiftCode?: string;
    savedAt: string;
};

type SavedPaymentInfoModalProps = {
    children: React.ReactNode;
    onLoad: (paymentInfo: PaymentInfoType) => void;
};

const SavedPaymentInfoModal = ({
    children,
    onLoad,
}: SavedPaymentInfoModalProps) => {
    const [open, setOpen] = useState(false);
    const [savedPaymentInfo, setSavedPaymentInfo] = useState<PaymentInfoType[]>(
        []
    );

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = window.localStorage.getItem(
                LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY
            );
            if (saved) {
                try {
                    setSavedPaymentInfo(JSON.parse(saved));
                } catch {
                    setSavedPaymentInfo([]);
                }
            }
        }
    }, [open]);

    const handleDelete = (id: string) => {
        const updated = savedPaymentInfo.filter((info) => info.id !== id);
        setSavedPaymentInfo(updated);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(
                LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY,
                JSON.stringify(updated)
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Saved Payment Information</DialogTitle>
                    <DialogDescription>
                        Select a saved payment information to load into the form
                    </DialogDescription>
                </DialogHeader>

                <SavedPaymentInfoList
                    savedPaymentInfo={savedPaymentInfo}
                    onLoad={onLoad}
                    onDelete={handleDelete}
                    setModalState={setOpen}
                />
            </DialogContent>
        </Dialog>
    );
};

export default SavedPaymentInfoModal;

