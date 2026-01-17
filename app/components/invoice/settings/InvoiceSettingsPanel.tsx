"use client";

import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { X } from "lucide-react";

// ShadCn
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useColumnNames } from "@/contexts/ColumnNamesContext";

// Types
import { InvoiceType } from "@/types";

interface InvoiceSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const InvoiceSettingsPanel = ({ isOpen, onClose }: InvoiceSettingsPanelProps) => {
    const { control, setValue, watch } = useFormContext<InvoiceType>();
    
    const {
        columnNames,
        extraDeliverableColumnNames,
        showExtraDeliverableColumns,
        setColumnNames,
        setExtraDeliverableColumnNames,
        setShowExtraDeliverableColumns,
        saveColumnNames,
        loading,
    } = useColumnNames();

    // Watch column visibility toggles
    const showPassengerName = watch("details.showPassengerName");
    const showRoute = watch("details.showRoute");
    const showAirlines = watch("details.showAirlines");
    const showServiceType = watch("details.showServiceType");
    const showAmount = watch("details.showAmount");

    // State for editing column names
    const [showColumnNameEditor, setShowColumnNameEditor] = useState(false);
    const [editingColumnNames, setEditingColumnNames] = useState(columnNames);
    const [isSaving, setIsSaving] = useState(false);

    // State for extra deliverable settings
    const [showExtraDeliverableEditor, setShowExtraDeliverableEditor] = useState(false);
    const [editingExtraDeliverableColumnNames, setEditingExtraDeliverableColumnNames] = useState(extraDeliverableColumnNames);
    const [editingShowExtraDeliverableColumns, setEditingShowExtraDeliverableColumns] = useState(showExtraDeliverableColumns);

    // Sync column names when context updates
    useEffect(() => {
        if (!loading) {
            setEditingColumnNames(columnNames);
            setEditingExtraDeliverableColumnNames(extraDeliverableColumnNames);
            setEditingShowExtraDeliverableColumns(showExtraDeliverableColumns);
            setValue("details.columnNames", columnNames);
            setValue("details.extraDeliverableColumnNames", extraDeliverableColumnNames);
            setValue("details.showExtraDeliverableColumns", showExtraDeliverableColumns);
        }
    }, [columnNames, extraDeliverableColumnNames, showExtraDeliverableColumns, loading, setValue]);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Side Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-2xl font-semibold">Invoice Settings</h2>
                        <BaseButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </BaseButton>
                    </div>

                    {/* Column Visibility Section */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold text-lg">Column Visibility</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowColumnNameEditor(!showColumnNameEditor)}
                            >
                                {showColumnNameEditor ? "Hide" : "Edit"} Column Names
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="settings-showPassengerName" className="cursor-pointer">
                                    {columnNames.passengerName}
                                </Label>
                                <Switch
                                    id="settings-showPassengerName"
                                    checked={showPassengerName ?? true}
                                    onCheckedChange={(value) => {
                                        setValue("details.showPassengerName", value);
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="settings-showRoute" className="cursor-pointer">
                                    {columnNames.route}
                                </Label>
                                <Switch
                                    id="settings-showRoute"
                                    checked={showRoute ?? true}
                                    onCheckedChange={(value) => {
                                        setValue("details.showRoute", value);
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="settings-showAirlines" className="cursor-pointer">
                                    {columnNames.airlines}
                                </Label>
                                <Switch
                                    id="settings-showAirlines"
                                    checked={showAirlines ?? true}
                                    onCheckedChange={(value) => {
                                        setValue("details.showAirlines", value);
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="settings-showServiceType" className="cursor-pointer">
                                    {columnNames.serviceType}
                                </Label>
                                <Switch
                                    id="settings-showServiceType"
                                    checked={showServiceType ?? true}
                                    onCheckedChange={(value) => {
                                        setValue("details.showServiceType", value);
                                    }}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="settings-showAmount" className="cursor-pointer">
                                    {columnNames.amount}
                                </Label>
                                <Switch
                                    id="settings-showAmount"
                                    checked={showAmount ?? true}
                                    onCheckedChange={(value) => {
                                        setValue("details.showAmount", value);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Column Name Editor */}
                        {showColumnNameEditor && (
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 space-y-4">
                                <Label className="block font-semibold">Customize Column Names</Label>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="editPassengerName" className="text-sm">Passenger Name</Label>
                                        <Input
                                            id="editPassengerName"
                                            value={editingColumnNames.passengerName}
                                            onChange={(e) => setEditingColumnNames({ ...editingColumnNames, passengerName: e.target.value })}
                                            placeholder="Passenger Name"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editRoute" className="text-sm">Route</Label>
                                        <Input
                                            id="editRoute"
                                            value={editingColumnNames.route}
                                            onChange={(e) => setEditingColumnNames({ ...editingColumnNames, route: e.target.value })}
                                            placeholder="Route"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editAirlines" className="text-sm">Airlines</Label>
                                        <Input
                                            id="editAirlines"
                                            value={editingColumnNames.airlines}
                                            onChange={(e) => setEditingColumnNames({ ...editingColumnNames, airlines: e.target.value })}
                                            placeholder="Airlines"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editServiceType" className="text-sm">Type of Service</Label>
                                        <Input
                                            id="editServiceType"
                                            value={editingColumnNames.serviceType}
                                            onChange={(e) => setEditingColumnNames({ ...editingColumnNames, serviceType: e.target.value })}
                                            placeholder="Type of Service"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editAmount" className="text-sm">Amount</Label>
                                        <Input
                                            id="editAmount"
                                            value={editingColumnNames.amount}
                                            onChange={(e) => setEditingColumnNames({ ...editingColumnNames, amount: e.target.value })}
                                            placeholder="Amount"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            setIsSaving(true);
                                            try {
                                                setColumnNames(editingColumnNames);
                                                setValue("details.columnNames", editingColumnNames);
                                                await saveColumnNames();
                                                setShowColumnNameEditor(false);
                                            } catch (error) {
                                                console.error("Error saving column names:", error);
                                                alert("Failed to save column names. Please try again.");
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save Column Names"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingColumnNames(columnNames);
                                            setShowColumnNameEditor(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Extra Deliverable Column Configuration */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold text-lg">Extra Deliverable Columns</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowExtraDeliverableEditor(!showExtraDeliverableEditor)}
                            >
                                {showExtraDeliverableEditor ? "Hide" : "Edit"} Column Names
                            </Button>
                        </div>

                        {showExtraDeliverableEditor && (
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 space-y-4">
                                <Label className="block font-semibold">Customize Extra Deliverable Column Names</Label>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="editExtraName" className="text-sm">Name</Label>
                                        <Input
                                            id="editExtraName"
                                            value={editingExtraDeliverableColumnNames.name}
                                            onChange={(e) => setEditingExtraDeliverableColumnNames({ ...editingExtraDeliverableColumnNames, name: e.target.value })}
                                            placeholder="Extra Deliverable"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editExtraServiceType" className="text-sm">Service Type</Label>
                                        <Input
                                            id="editExtraServiceType"
                                            value={editingExtraDeliverableColumnNames.serviceType}
                                            onChange={(e) => setEditingExtraDeliverableColumnNames({ ...editingExtraDeliverableColumnNames, serviceType: e.target.value })}
                                            placeholder="Type of Service"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editExtraAmount" className="text-sm">Amount</Label>
                                        <Input
                                            id="editExtraAmount"
                                            value={editingExtraDeliverableColumnNames.amount}
                                            onChange={(e) => setEditingExtraDeliverableColumnNames({ ...editingExtraDeliverableColumnNames, amount: e.target.value })}
                                            placeholder="Amount"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editExtraVatPercentage" className="text-sm">VAT %</Label>
                                        <Input
                                            id="editExtraVatPercentage"
                                            value={editingExtraDeliverableColumnNames.vatPercentage}
                                            onChange={(e) => setEditingExtraDeliverableColumnNames({ ...editingExtraDeliverableColumnNames, vatPercentage: e.target.value })}
                                            placeholder="VAT %"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="editExtraVat" className="text-sm">VAT Amount</Label>
                                        <Input
                                            id="editExtraVat"
                                            value={editingExtraDeliverableColumnNames.vat}
                                            onChange={(e) => setEditingExtraDeliverableColumnNames({ ...editingExtraDeliverableColumnNames, vat: e.target.value })}
                                            placeholder="VAT Amount"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <Label className="block font-semibold pt-2">Column Visibility</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showExtraName" className="cursor-pointer">Name</Label>
                                        <Switch
                                            id="showExtraName"
                                            checked={editingShowExtraDeliverableColumns.name ?? true}
                                            onCheckedChange={(value) => setEditingShowExtraDeliverableColumns({ ...editingShowExtraDeliverableColumns, name: value })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showExtraServiceType" className="cursor-pointer">Service Type</Label>
                                        <Switch
                                            id="showExtraServiceType"
                                            checked={editingShowExtraDeliverableColumns.serviceType ?? true}
                                            onCheckedChange={(value) => setEditingShowExtraDeliverableColumns({ ...editingShowExtraDeliverableColumns, serviceType: value })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showExtraAmount" className="cursor-pointer">Amount</Label>
                                        <Switch
                                            id="showExtraAmount"
                                            checked={editingShowExtraDeliverableColumns.amount ?? true}
                                            onCheckedChange={(value) => setEditingShowExtraDeliverableColumns({ ...editingShowExtraDeliverableColumns, amount: value })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showExtraVatPercentage" className="cursor-pointer">VAT %</Label>
                                        <Switch
                                            id="showExtraVatPercentage"
                                            checked={editingShowExtraDeliverableColumns.vatPercentage ?? true}
                                            onCheckedChange={(value) => setEditingShowExtraDeliverableColumns({ ...editingShowExtraDeliverableColumns, vatPercentage: value })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="showExtraVat" className="cursor-pointer">VAT Amount</Label>
                                        <Switch
                                            id="showExtraVat"
                                            checked={editingShowExtraDeliverableColumns.vat ?? true}
                                            onCheckedChange={(value) => setEditingShowExtraDeliverableColumns({ ...editingShowExtraDeliverableColumns, vat: value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            setIsSaving(true);
                                            try {
                                                setExtraDeliverableColumnNames(editingExtraDeliverableColumnNames);
                                                setShowExtraDeliverableColumns(editingShowExtraDeliverableColumns);
                                                setValue("details.extraDeliverableColumnNames", editingExtraDeliverableColumnNames);
                                                setValue("details.showExtraDeliverableColumns", editingShowExtraDeliverableColumns);
                                                await saveColumnNames();
                                                setShowExtraDeliverableEditor(false);
                                            } catch (error) {
                                                console.error("Error saving extra deliverable column names:", error);
                                                alert("Failed to save column names. Please try again.");
                                            } finally {
                                                setIsSaving(false);
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Saving..." : "Save Column Names"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setEditingExtraDeliverableColumnNames(extraDeliverableColumnNames);
                                            setEditingShowExtraDeliverableColumns(showExtraDeliverableColumns);
                                            setShowExtraDeliverableEditor(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default InvoiceSettingsPanel;

