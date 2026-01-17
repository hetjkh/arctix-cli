"use client";

import { useState, useEffect } from "react";

// RHF
import { useFormContext, useFieldArray } from "react-hook-form";

// Components
import { FormInput, Subheading, BaseButton, SavedPaymentInfoModal } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Variables
import { LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY, SHORT_DATE_OPTIONS } from "@/lib/variables";

// Hooks
import useToasts from "@/hooks/useToasts";

// Types
import { InvoiceType } from "@/types";

// Icons
import { Save, FolderOpen, Plus, Trash2 } from "lucide-react";

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

const PaymentInformation = () => {
    const { _t } = useTranslationContext();
    const { control, setValue, watch } = useFormContext<InvoiceType>();
    const { saveInvoiceSuccess } = useToasts();
    const [saveName, setSaveName] = useState("");
    const [saveIndex, setSaveIndex] = useState(0);

    const PAYMENT_INFO_NAME = "details.paymentInformation";
    
    // Watch current payment information
    const paymentInfo = watch(PAYMENT_INFO_NAME);
    
    const { fields, append, remove } = useFieldArray({
        control,
        name: PAYMENT_INFO_NAME as any,
    });

    // Normalize to array format if needed (backward compatibility)
    useEffect(() => {
        if (paymentInfo && !Array.isArray(paymentInfo)) {
            // Convert single object to array
            setValue(PAYMENT_INFO_NAME, [paymentInfo] as any);
        } else if (!paymentInfo || (Array.isArray(paymentInfo) && paymentInfo.length === 0)) {
            // Initialize with one empty entry if empty
            if (!paymentInfo || (Array.isArray(paymentInfo) && paymentInfo.length === 0)) {
                setValue(PAYMENT_INFO_NAME, [{
                    bankName: "",
                    accountName: "",
                    accountNumber: "",
                    iban: "",
                    swiftCode: "",
                }] as any);
            }
        }
    }, []); // Only run once on mount

    const handleSave = (index: number) => {
        const currentPaymentInfo = Array.isArray(paymentInfo) ? paymentInfo[index] : paymentInfo;
        
        if (!currentPaymentInfo?.bankName || !currentPaymentInfo?.accountName || !currentPaymentInfo?.accountNumber) {
            alert("Please fill in at least Bank Name, Account Name, and Account Number before saving.");
            return;
        }

        const name = saveName.trim() || `${currentPaymentInfo.bankName} - ${currentPaymentInfo.accountName}`;
        
        const savedAt = new Date().toLocaleDateString("en-US", SHORT_DATE_OPTIONS);
        
        const newPaymentInfo: PaymentInfoType = {
            id: Date.now().toString(),
            name: name,
            bankName: currentPaymentInfo.bankName || "",
            accountName: currentPaymentInfo.accountName || "",
            accountNumber: currentPaymentInfo.accountNumber || "",
            iban: currentPaymentInfo.iban || "",
            swiftCode: currentPaymentInfo.swiftCode || "",
            savedAt: savedAt,
        };

        if (typeof window !== "undefined") {
            try {
                const saved = window.localStorage.getItem(LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY);
                const savedList: PaymentInfoType[] = saved ? JSON.parse(saved) : [];
                savedList.push(newPaymentInfo);
                window.localStorage.setItem(
                    LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY,
                    JSON.stringify(savedList)
                );
                saveInvoiceSuccess();
                setSaveName("");
            } catch (error) {
                console.error("Error saving payment information:", error);
                // If there's corrupted data, clear it and save fresh
                const freshList: PaymentInfoType[] = [newPaymentInfo];
                window.localStorage.setItem(
                    LOCAL_STORAGE_SAVED_PAYMENT_INFO_KEY,
                    JSON.stringify(freshList)
                );
                saveInvoiceSuccess();
                setSaveName("");
            }
        }
    };

    const handleLoad = (index: number) => (paymentInfo: PaymentInfoType) => {
        setValue(`${PAYMENT_INFO_NAME}[${index}]` as any, {
            bankName: paymentInfo.bankName,
            accountName: paymentInfo.accountName,
            accountNumber: paymentInfo.accountNumber,
            iban: paymentInfo.iban || "",
            swiftCode: paymentInfo.swiftCode || "",
        });
    };

    const addNewPaymentInfo = () => {
        if (fields.length < 4) {
            append({
                bankName: "",
                accountName: "",
                accountNumber: "",
                iban: "",
                swiftCode: "",
            });
        }
    };

    const removePaymentInfo = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-2">
                <Subheading>{_t("form.steps.paymentInfo.heading")}:</Subheading>
            </div>

            {fields.map((field, index) => (
                <div key={field.id} className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Payment Information {fields.length > 1 ? index + 1 : ''}
                        </p>
                        <div className="flex gap-2">
                            <SavedPaymentInfoModal onLoad={handleLoad(index)}>
                                <BaseButton
                                    variant="outline"
                                    size="sm"
                                    tooltipLabel="Load saved payment information"
                                >
                                    <FolderOpen className="w-4 h-4" />
                                    Load Saved
                                </BaseButton>
                            </SavedPaymentInfoModal>
                            <input
                                type="text"
                                placeholder="Save as..."
                                value={index === saveIndex ? saveName : ""}
                                onChange={(e) => {
                                    setSaveName(e.target.value);
                                    setSaveIndex(index);
                                }}
                                className="px-3 py-1 text-sm border rounded-md w-32 dark:bg-slate-800 dark:border-gray-600"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSave(index);
                                    }
                                }}
                            />
                            <BaseButton
                                variant="outline"
                                size="sm"
                                onClick={() => handleSave(index)}
                                tooltipLabel="Save current payment information"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </BaseButton>
                            {fields.length > 1 && (
                                <BaseButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removePaymentInfo(index)}
                                    tooltipLabel="Remove payment information"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </BaseButton>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-10 mt-5">
                        <FormInput
                            name={`${PAYMENT_INFO_NAME}[${index}].bankName`}
                            label={_t("form.steps.paymentInfo.bankName")}
                            placeholder={_t("form.steps.paymentInfo.bankName")}
                            vertical
                        />
                        <FormInput
                            name={`${PAYMENT_INFO_NAME}[${index}].accountName`}
                            label={_t("form.steps.paymentInfo.accountName")}
                            placeholder={_t("form.steps.paymentInfo.accountName")}
                            vertical
                        />
                        <FormInput
                            name={`${PAYMENT_INFO_NAME}[${index}].accountNumber`}
                            label={_t("form.steps.paymentInfo.accountNumber")}
                            placeholder={_t("form.steps.paymentInfo.accountNumber")}
                            vertical
                        />
                        <FormInput
                            name={`${PAYMENT_INFO_NAME}[${index}].iban`}
                            label="IBAN No"
                            placeholder="IBAN Number"
                            vertical
                        />
                        <FormInput
                            name={`${PAYMENT_INFO_NAME}[${index}].swiftCode`}
                            label="SWIFT Code"
                            placeholder="SWIFT Code"
                            vertical
                        />
                    </div>
                </div>
            ))}

            {fields.length < 4 && (
                <div className="mt-4">
                    <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={addNewPaymentInfo}
                        tooltipLabel="Add another payment information"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Payment Information
                    </BaseButton>
                </div>
            )}
        </section>
    );
};

export default PaymentInformation;
