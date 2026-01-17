"use client";

import React from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Card, CardContent } from "@/components/ui/card";

// Components
import { BaseButton } from "@/app/components";

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

type SavedPaymentInfoListProps = {
    savedPaymentInfo: PaymentInfoType[];
    onLoad: (paymentInfo: PaymentInfoType) => void;
    onDelete: (id: string) => void;
    setModalState: React.Dispatch<React.SetStateAction<boolean>>;
};

const SavedPaymentInfoList = ({
    savedPaymentInfo,
    onLoad,
    onDelete,
    setModalState,
}: SavedPaymentInfoListProps) => {
    return (
        <>
            <div className="flex flex-col gap-5 overflow-y-auto max-h-72">
                {savedPaymentInfo.map((info) => (
                    <Card
                        key={info.id}
                        className="p-2 border rounded-sm hover:border-blue-500 hover:shadow-lg cursor-pointer"
                    >
                        <CardContent className="flex justify-between">
                            <div>
                                <p className="font-semibold">{info.name}</p>
                                <small className="text-gray-500">
                                    Saved at: {info.savedAt}
                                </small>
                                <div className="mt-2 text-sm">
                                    <p>
                                        <span className="font-medium">Bank:</span>{" "}
                                        {info.bankName}
                                    </p>
                                    <p>
                                        <span className="font-medium">Account:</span>{" "}
                                        {info.accountName}
                                    </p>
                                    <p>
                                        <span className="font-medium">Account #:</span>{" "}
                                        {info.accountNumber}
                                    </p>
                                    {info.iban && (
                                        <p>
                                            <span className="font-medium">IBAN:</span>{" "}
                                            {info.iban}
                                        </p>
                                    )}
                                    {info.swiftCode && (
                                        <p>
                                            <span className="font-medium">SWIFT:</span>{" "}
                                            {info.swiftCode}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <BaseButton
                                    tooltipLabel="Load payment details into the form"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onLoad(info);
                                        setModalState(false);
                                    }}
                                >
                                    Load
                                </BaseButton>
                                <BaseButton
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(info.id);
                                    }}
                                >
                                    Delete
                                </BaseButton>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {savedPaymentInfo.length === 0 && (
                    <div>
                        <p className="text-gray-500 text-center py-4">
                            No saved payment information
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default SavedPaymentInfoList;

