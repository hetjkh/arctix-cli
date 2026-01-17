"use client";

import React from "react";

// RHF
import { useFieldArray, useFormContext } from "react-hook-form";

// Components
import {
    BaseButton,
    FormCustomInput,
    FormInput,
    Subheading,
} from "@/app/components";
import ClientSelector from "@/app/components/client/ClientSelector";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Plus, Trash2 } from "lucide-react";

const BillToSection = () => {
    const { control } = useFormContext();

    const { _t } = useTranslationContext();

    const CUSTOM_INPUT_NAME = "receiver.customInputs";
    const { fields: customFields, append: appendCustom, remove: removeCustom } = useFieldArray({
        control: control,
        name: CUSTOM_INPUT_NAME,
    });

    const PHONE_INPUT_NAME = "receiver.phone";
    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
        control: control,
        name: PHONE_INPUT_NAME,
    });

    // Ensure at least one phone field is always present
    React.useEffect(() => {
        if (phoneFields.length === 0) {
            appendPhone("");
        }
    }, [phoneFields.length, appendPhone]);

    const addNewCustomInput = () => {
        appendCustom({
            key: "",
            value: "",
        });
    };

    const removeCustomInput = (index: number) => {
        removeCustom(index);
    };

    const addNewPhone = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        appendPhone("");
    };

    const removePhoneInput = (index: number) => {
        removePhone(index);
    };

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Subheading>{_t("form.steps.fromAndTo.billTo")}:</Subheading>
            </div>
            <ClientSelector />
            <FormInput
                name="receiver.name"
                label={_t("form.steps.fromAndTo.name")}
                placeholder="Receiver name"
            />
            <FormInput
                name="receiver.city"
                label={_t("form.steps.fromAndTo.city")}
                placeholder="Receiver city"
            />
            <FormInput
                name="receiver.country"
                label={_t("form.steps.fromAndTo.country")}
                placeholder="Receiver country"
            />
            <FormInput
                name="receiver.email"
                label={_t("form.steps.fromAndTo.email")}
                placeholder="Receiver email"
            />
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{_t("form.steps.fromAndTo.phone")}:</label>
                    <BaseButton
                        tooltipLabel="Add phone number"
                        size="sm"
                        variant="link"
                        type="button"
                        className="w-fit h-6"
                        onClick={addNewPhone}
                    >
                        <Plus className="h-4 w-4" />
                    </BaseButton>
                </div>
                {phoneFields?.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <FormInput
                            name={`receiver.phone.${index}`}
                            placeholder="Receiver phone number"
                            type="text"
                            inputMode="tel"
                            pattern="[0-9+\-\(\)\s]*"
                            aria-describedby="phone-format"
                            onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                target.value = target.value.replace(/[^\d\+\-\(\)\s]/g, "");
                            }}
                        />
                        {phoneFields.length > 1 && (
                            <BaseButton
                                size="icon"
                                variant="destructive"
                                onClick={() => removePhoneInput(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </BaseButton>
                        )}
                    </div>
                ))}
            </div>
            {/* //? key = field.id fixes a bug where wrong field gets deleted  */}
            {customFields?.map((field, index) => (
                <FormCustomInput
                    key={field.id}
                    index={index}
                    location={CUSTOM_INPUT_NAME}
                    removeField={removeCustomInput}
                />
            ))}
            <BaseButton
                tooltipLabel="Add custom input to receiver"
                size="sm"
                variant="link"
                className="w-fit"
                onClick={addNewCustomInput}
            >
                <Plus />
                {_t("form.steps.fromAndTo.addCustomInput")}
            </BaseButton>
        </section>
    );
};

export default BillToSection;
