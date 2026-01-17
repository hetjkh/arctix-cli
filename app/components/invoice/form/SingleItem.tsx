"use client";

import { useEffect, useRef } from "react";

// RHF
import { FieldArrayWithId, useFormContext, useWatch, useFieldArray } from "react-hook-form";

// DnD
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ShadCn
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Components
import { BaseButton, FormInput, FormTextarea } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useColumnNames } from "@/contexts/ColumnNamesContext";

// Icons
import { ChevronDown, ChevronUp, GripVertical, Trash2, Plus } from "lucide-react";

// Types
import { ItemType, NameType } from "@/types";

type SingleItemProps = {
    name: NameType;
    index: number;
    fields: ItemType[];
    field: FieldArrayWithId<ItemType>;
    moveFieldUp: (index: number) => void;
    moveFieldDown: (index: number) => void;
    removeField: (index: number) => void;
};

const SingleItem = ({
    name,
    index,
    fields,
    field,
    moveFieldUp,
    moveFieldDown,
    removeField,
}: SingleItemProps) => {
    const { control, setValue } = useFormContext();

    const { _t } = useTranslationContext();
    const { columnNames, extraDeliverableColumnNames, showExtraDeliverableColumns } = useColumnNames();

    // Items
    const rate = useWatch({
        name: `${name}[${index}].unitPrice`,
        control,
    });

    const quantity = useWatch({
        name: `${name}[${index}].quantity`,
        control,
    });

    const total = useWatch({
        name: `${name}[${index}].total`,
        control,
    });

    const vatPercentage = useWatch({
        name: `${name}[${index}].vatPercentage`,
        control,
    });

    const vat = useWatch({
        name: `${name}[${index}].vat`,
        control,
    });

    // Extra Deliverables - using field array
    const extraDeliverablesFieldArray = useFieldArray({
        control,
        name: `${name}[${index}].extraDeliverables`,
    });

    const { fields: extraDeliverableFields, append: appendExtraDeliverable, remove: removeExtraDeliverable } = extraDeliverablesFieldArray;

    // Watch all extra deliverables for total calculation
    const extraDeliverables = useWatch({
        name: `${name}[${index}].extraDeliverables`,
        control,
    }) || [];

    // Currency
    const currency = useWatch({
        name: `details.currency`,
        control,
    });

    // Template
    const pdfTemplate = useWatch({
        name: `details.pdfTemplate`,
        control,
    });

    // Calculate VAT amount from rate and VAT percentage
    // VAT Amount = Rate × (VAT Percentage / 100)
    useEffect(() => {
        if (vatPercentage != undefined && vatPercentage !== "" && rate != undefined) {
            const vatPercentValue = Number(vatPercentage) || 0;
            const rateValue = Number(rate) || 0;

            if (vatPercentValue >= 0 && rateValue > 0) {
                // Calculate VAT: Rate × (VAT Percentage / 100)
                const calculatedVatAmount = (rateValue * (vatPercentValue / 100)).toFixed(2);
                setValue(`${name}[${index}].vat`, calculatedVatAmount);
            } else {
                setValue(`${name}[${index}].vat`, "0");
            }
        } else {
            // If VAT percentage or rate is cleared, reset VAT amount
            setValue(`${name}[${index}].vat`, "0");
        }
    }, [vatPercentage, rate, setValue, name, index]);

    // Calculate VAT for each extra deliverable
    // Use a ref to track previous values and prevent infinite loops
    const prevExtraDeliverablesRef = useRef<string>("");
    
    useEffect(() => {
        if (!extraDeliverables || !Array.isArray(extraDeliverables)) return;
        
        // Create a stable key from vatPercentage and amount (excluding vat to prevent loops)
        const currentKey = extraDeliverables.map(e => `${e?.vatPercentage || ''}_${e?.amount || ''}`).join('|');
        
        // Only recalculate if the inputs (vatPercentage or amount) changed
        if (currentKey === prevExtraDeliverablesRef.current) return;
        prevExtraDeliverablesRef.current = currentKey;
        
        extraDeliverables.forEach((extra, extraIndex) => {
            const extraVatPercentage = extra?.vatPercentage;
            const extraAmount = extra?.amount;
            const currentVat = extra?.vat || "0";

            // Check if we have valid inputs for VAT calculation
            const hasVatInputs = extraVatPercentage !== undefined && 
                                 extraVatPercentage !== "" && 
                                 extraVatPercentage !== null &&
                                 extraAmount !== undefined && 
                                 extraAmount !== "" && 
                                 extraAmount !== null;
            
            if (hasVatInputs) {
                const vatPercentValue = Number(extraVatPercentage) || 0;
                const extraAmountValue = Number(extraAmount) || 0;

                // Calculate VAT if we have valid percentage and amount (amount can be 0)
                if (vatPercentValue >= 0 && extraAmountValue >= 0) {
                    const calculatedVatAmount = (extraAmountValue * (vatPercentValue / 100)).toFixed(2);
                    // Only update if the value actually changed
                    if (calculatedVatAmount !== currentVat) {
                        setValue(`${name}[${index}].extraDeliverables[${extraIndex}].vat`, calculatedVatAmount, { shouldDirty: false });
                    }
                } else {
                    // Invalid values, reset VAT to 0
                    if (currentVat !== "0" && currentVat !== "") {
                        setValue(`${name}[${index}].extraDeliverables[${extraIndex}].vat`, "0", { shouldDirty: false });
                    }
                }
            } else {
                // No valid inputs, only reset if we had a value before
                if (currentVat !== "0" && currentVat !== "" && currentVat !== null && currentVat !== undefined) {
                    setValue(`${name}[${index}].extraDeliverables[${extraIndex}].vat`, "0", { shouldDirty: false });
                }
            }
        });
    }, [extraDeliverables, setValue, name, index]);

    useEffect(() => {
        // Calculate total when rate, VAT, or extra deliverable amounts change (quantity is always 1 for passengers)
        // Total = rate + VAT amount + sum of all extra deliverable amounts + sum of all extra deliverable VATs
        if (rate != undefined) {
            const rateValue = Number(rate) || 0;
            const vatValue = Number(vat) || 0;
            
            // Sum all extra deliverable amounts and VATs
            // item.total should ALWAYS include everything (rate + VAT + extra amounts + extra VATs)
            // The ChargesContext will handle subtracting VAT based on toggles
            let totalExtraAmount = 0;
            let totalExtraVat = 0;
            if (extraDeliverables && Array.isArray(extraDeliverables)) {
                extraDeliverables.forEach((extra) => {
                    // Check if amount exists and is not empty
                    if (extra?.amount !== undefined && extra?.amount !== null && extra?.amount !== "") {
                        totalExtraAmount += Number(extra.amount) || 0;
                    }
                    // Include all VAT in item.total - ChargesContext will subtract based on toggles
                    if (extra?.vat !== undefined && extra?.vat !== null && extra?.vat !== "") {
                        totalExtraVat += Number(extra.vat) || 0;
                    }
                });
            }
            
            const calculatedTotal = (rateValue + vatValue + totalExtraAmount + totalExtraVat).toFixed(2);
            setValue(`${name}[${index}].total`, calculatedTotal);
            setValue(`${name}[${index}].quantity`, 1);
        }
    }, [rate, vat, extraDeliverables, setValue, name, index]);

    // DnD
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const boxDragClasses = isDragging
        ? "border-2 bg-gray-200 border-blue-600 dark:bg-slate-900 z-10"
        : "border";

    const gripDragClasses = isDragging
        ? "opacity-0 group-hover:opacity-100 transition-opacity cursor-grabbing"
        : "cursor-grab";

    return (
        <div
            style={style}
            {...attributes}
            className={`${boxDragClasses} group flex flex-col gap-y-6 p-6 my-4 cursor-default rounded-xl bg-gray-50 dark:bg-slate-800 dark:border-gray-600`}
        >
            {/* {isDragging && <div className="bg-blue-600 h-1 rounded-full"></div>} */}
            <div className="flex flex-wrap justify-between items-center pb-2 border-b border-gray-300 dark:border-gray-600">
                <p className="font-semibold text-lg">
                    Person {index + 1}
                </p>

                <div className="flex gap-3">
                    {/* Drag and Drop Button */}
                    <div
                        className={`${gripDragClasses} flex justify-center items-center`}
                        ref={setNodeRef}
                        {...listeners}
                    >
                        <GripVertical className="hover:text-blue-600" />
                    </div>

                    {/* Up Button */}
                    <BaseButton
                        size={"icon"}
                        tooltipLabel="Move the item up"
                        onClick={() => moveFieldUp(index)}
                        disabled={index === 0}
                    >
                        <ChevronUp />
                    </BaseButton>

                    {/* Down Button */}
                    <BaseButton
                        size={"icon"}
                        tooltipLabel="Move the item down"
                        onClick={() => moveFieldDown(index)}
                        disabled={index === fields.length - 1}
                    >
                        <ChevronDown />
                    </BaseButton>
                </div>
            </div>
            <div className="space-y-6">
                {/* Passenger and Service Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Passenger & Service Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="w-full">
                            <FormInput
                                name={`${name}[${index}].passengerName`}
                                label={`${columnNames.passengerName} (Person ${index + 1})`}
                                placeholder={`Enter passenger ${index + 1} name`}
                                vertical
                                className="w-full"
                            />
                        </div>

                        <div className="w-full">
                            <FormInput
                                name={`${name}[${index}].name`}
                                label={columnNames.airlines}
                                placeholder="Enter airline name"
                                vertical
                                className="w-full"
                            />
                        </div>

                        <div className="w-full">
                            <FormInput
                                name={`${name}[${index}].serviceType`}
                                label={columnNames.serviceType}
                                placeholder="Enter type of service"
                                vertical
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Financial Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="w-full">
                            <FormInput
                                name={`${name}[${index}].unitPrice`}
                                type="number"
                                label="Rate"
                                labelHelper={`(${currency})`}
                                placeholder="Enter rate"
                                vertical
                                className="w-full"
                            />
                        </div>

                        <div className="w-full">
                            <FormInput
                                name={`${name}[${index}].vatPercentage`}
                                type="number"
                                label="VAT %"
                                labelHelper="(%)"
                                placeholder="Enter VAT %"
                                vertical
                                className="w-full"
                            />
                        </div>

                        <div className="w-full">
                            <FormInput
                                name={`${name}[${index}].vat`}
                                type="number"
                                label="VAT Amount"
                                labelHelper={`(${currency})`}
                                placeholder="Auto-calculated"
                                vertical
                                readOnly
                                className="w-full"
                            />
                        </div>

                        <div className="w-full flex flex-col gap-2">
                            <Label className="text-sm font-medium">Total</Label>
                            <Input
                                value={`${total} ${currency}`}
                                readOnly
                                placeholder="Item total"
                                className="w-full h-10 border-gray-300 dark:border-gray-600 font-semibold text-base bg-gray-100 dark:bg-slate-700"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Route/Description */}
                <div className="space-y-2">
                    <FormTextarea
                        name={`${name}[${index}].description`}
                        label={columnNames.route}
                        placeholder="Enter description"
                    />
                </div>

                {/* Extra Deliverables Section */}
                <div className="space-y-4 border-t border-gray-300 dark:border-gray-600 pt-6">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Extra Deliverables</h3>
                        <BaseButton
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                appendExtraDeliverable({
                                    name: "",
                                    rowName: "", // Custom name for this row
                                    serviceType: "",
                                    amount: "0",
                                    vatPercentage: "",
                                    vat: "0",
                                    showVat: false,
                                    showColumns: {
                                        name: true,
                                        serviceType: true,
                                        amount: true,
                                        vatPercentage: true,
                                        vat: true,
                                    },
                                });
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Extra Deliverable
                        </BaseButton>
                    </div>

                    {extraDeliverableFields.length > 0 && (
                        <div className="space-y-5">
                            {extraDeliverableFields.map((extraField, extraIndex) => {
                                // Get the current value from the form, not just from watched values
                                const extraDeliverable = extraDeliverables[extraIndex] || {};
                                const extraShowVat = extraDeliverable?.showVat || false;
                                
                                // Get per-deliverable column visibility, defaulting to all true if not set
                                const defaultShowColumns = {
                                    name: true,
                                    serviceType: true,
                                    amount: true,
                                    vatPercentage: true,
                                    vat: true,
                                };
                                const showColumns = extraDeliverable?.showColumns || defaultShowColumns;
                                
                                // Ensure we have a valid entry - if not, skip rendering
                                if (!extraField) return null;
                                
                                return (
                                    <div key={extraField.id} className="p-5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-900 space-y-5">
                                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                                            <Label className="font-semibold text-base">Extra Deliverable {extraIndex + 1}</Label>
                                            <BaseButton
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => removeExtraDeliverable(extraIndex)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </BaseButton>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-md">
                                            <Label htmlFor={`extraShowVat-${index}-${extraIndex}`} className="font-medium">
                                                Show VAT in Template
                                            </Label>
                                            <Switch
                                                id={`extraShowVat-${index}-${extraIndex}`}
                                                checked={extraShowVat}
                                                onCheckedChange={(value) => {
                                                    setValue(`${name}[${index}].extraDeliverables[${extraIndex}].showVat`, value);
                                                }}
                                            />
                                        </div>

                                        {/* Column Visibility Controls */}
                                        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-gray-700">
                                            <Label className="text-sm font-semibold mb-3 block">Column Visibility (Toggle columns for this deliverable)</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`showName-${index}-${extraIndex}`}
                                                        checked={showColumns.name ?? true}
                                                        onCheckedChange={(value) => {
                                                            const currentShowColumns = extraDeliverable?.showColumns || defaultShowColumns;
                                                            setValue(`${name}[${index}].extraDeliverables[${extraIndex}].showColumns`, {
                                                                ...currentShowColumns,
                                                                name: value,
                                                            });
                                                        }}
                                                    />
                                                    <Label htmlFor={`showName-${index}-${extraIndex}`} className="text-sm cursor-pointer">
                                                        {extraDeliverableColumnNames.name}
                                                    </Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`showServiceType-${index}-${extraIndex}`}
                                                        checked={showColumns.serviceType ?? true}
                                                        onCheckedChange={(value) => {
                                                            const currentShowColumns = extraDeliverable?.showColumns || defaultShowColumns;
                                                            setValue(`${name}[${index}].extraDeliverables[${extraIndex}].showColumns`, {
                                                                ...currentShowColumns,
                                                                serviceType: value,
                                                            });
                                                        }}
                                                    />
                                                    <Label htmlFor={`showServiceType-${index}-${extraIndex}`} className="text-sm cursor-pointer">
                                                        {extraDeliverableColumnNames.serviceType}
                                                    </Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`showAmount-${index}-${extraIndex}`}
                                                        checked={showColumns.amount ?? true}
                                                        onCheckedChange={(value) => {
                                                            const currentShowColumns = extraDeliverable?.showColumns || defaultShowColumns;
                                                            setValue(`${name}[${index}].extraDeliverables[${extraIndex}].showColumns`, {
                                                                ...currentShowColumns,
                                                                amount: value,
                                                            });
                                                        }}
                                                    />
                                                    <Label htmlFor={`showAmount-${index}-${extraIndex}`} className="text-sm cursor-pointer">
                                                        {extraDeliverableColumnNames.amount}
                                                    </Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`showVatPercentage-${index}-${extraIndex}`}
                                                        checked={showColumns.vatPercentage ?? true}
                                                        onCheckedChange={(value) => {
                                                            const currentShowColumns = extraDeliverable?.showColumns || defaultShowColumns;
                                                            setValue(`${name}[${index}].extraDeliverables[${extraIndex}].showColumns`, {
                                                                ...currentShowColumns,
                                                                vatPercentage: value,
                                                            });
                                                        }}
                                                    />
                                                    <Label htmlFor={`showVatPercentage-${index}-${extraIndex}`} className="text-sm cursor-pointer">
                                                        {extraDeliverableColumnNames.vatPercentage}
                                                    </Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`showVat-${index}-${extraIndex}`}
                                                        checked={showColumns.vat ?? true}
                                                        onCheckedChange={(value) => {
                                                            const currentShowColumns = extraDeliverable?.showColumns || defaultShowColumns;
                                                            setValue(`${name}[${index}].extraDeliverables[${extraIndex}].showColumns`, {
                                                                ...currentShowColumns,
                                                                vat: value,
                                                            });
                                                        }}
                                                    />
                                                    <Label htmlFor={`showVat-${index}-${extraIndex}`} className="text-sm cursor-pointer">
                                                        {extraDeliverableColumnNames.vat}
                                                    </Label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="w-full">
                                                <FormInput
                                                    name={`${name}[${index}].extraDeliverables[${extraIndex}].rowName`}
                                                    label="Row Name (Passenger Name Column)"
                                                    placeholder="Enter row name/title"
                                                    vertical
                                                    className="w-full"
                                                />
                                            </div>
                                            
                                            {showColumns.name && (
                                                <div className="w-full">
                                                    <FormInput
                                                        name={`${name}[${index}].extraDeliverables[${extraIndex}].name`}
                                                        label={extraDeliverableColumnNames.name}
                                                        placeholder="Enter extra deliverable details"
                                                        vertical
                                                        className="w-full"
                                                    />
                                                </div>
                                            )}

                                            {showColumns.serviceType && (
                                                <div className="w-full">
                                                    <FormInput
                                                        name={`${name}[${index}].extraDeliverables[${extraIndex}].serviceType`}
                                                        label={extraDeliverableColumnNames.serviceType}
                                                        placeholder="Enter service type"
                                                        vertical
                                                        className="w-full"
                                                    />
                                                </div>
                                            )}

                                            {showColumns.amount && (
                                                <div className="w-full">
                                                    <FormInput
                                                        name={`${name}[${index}].extraDeliverables[${extraIndex}].amount`}
                                                        type="number"
                                                        label={extraDeliverableColumnNames.amount}
                                                        labelHelper={`(${currency})`}
                                                        placeholder="Enter amount"
                                                        vertical
                                                        className="w-full"
                                                    />
                                                </div>
                                            )}

                                            {showColumns.vatPercentage && (
                                                <div className="w-full">
                                                    <FormInput
                                                        name={`${name}[${index}].extraDeliverables[${extraIndex}].vatPercentage`}
                                                        type="number"
                                                        label={extraDeliverableColumnNames.vatPercentage}
                                                        labelHelper="(%)"
                                                        placeholder="Enter VAT %"
                                                        vertical
                                                        className="w-full"
                                                    />
                                                </div>
                                            )}

                                            {showColumns.vat && (
                                                <div className="w-full">
                                                    <FormInput
                                                        name={`${name}[${index}].extraDeliverables[${extraIndex}].vat`}
                                                        type="number"
                                                        label={extraDeliverableColumnNames.vat}
                                                        labelHelper={`(${currency})`}
                                                        placeholder="Auto-calculated"
                                                        vertical
                                                        readOnly
                                                        className="w-full"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                {/* Not allowing deletion for first item when there is only 1 item */}
                {fields.length > 1 && (
                    <BaseButton
                        variant="destructive"
                        onClick={() => removeField(index)}
                    >
                        <Trash2 />
                        {_t("form.steps.lineItems.removeItem")}
                    </BaseButton>
                )}
            </div>
        </div>
    );
};

export default SingleItem;
