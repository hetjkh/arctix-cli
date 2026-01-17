"use client";

import { useState, useEffect } from "react";
import { InvoiceType } from "@/types";
import { formatNumberWithCommas } from "@/lib/helpers";
import { DATE_OPTIONS } from "@/lib/variables";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Save } from "lucide-react";
import { BaseButton } from "@/app/components";

interface Client {
    id: string;
    name: string;
    email: string;
}

type StatementPreviewModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoices: InvoiceType[];
    clientId?: string;
    clientEmail?: string;
    onSaveSuccess?: () => void;
};

const StatementPreviewModal = ({
    open,
    onOpenChange,
    invoices,
    clientId: initialClientId,
    clientEmail: initialClientEmail,
    onSaveSuccess,
}: StatementPreviewModalProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || "");
    const [selectedClientEmail, setSelectedClientEmail] = useState<string>(initialClientEmail || "");
    const [loadingClients, setLoadingClients] = useState(true);
    const [billedToName, setBilledToName] = useState<string>("");

    // Flatten invoices into passenger rows (one row per item/passenger)
    type PassengerRow = {
        invoice: InvoiceType;
        item: InvoiceType["details"]["items"][0];
        itemIndex: number;
    };

    const passengerRows: PassengerRow[] = [];
    
    // Sort invoices by date first
    const sortedInvoices = [...invoices].sort((a, b) => {
        const dateA = new Date(a.details.invoiceDate).getTime();
        const dateB = new Date(b.details.invoiceDate).getTime();
        return dateA - dateB;
    });

    // Create a row for each passenger (item) in each invoice
    sortedInvoices.forEach((invoice) => {
        invoice.details.items.forEach((item, itemIndex) => {
            passengerRows.push({ invoice, item, itemIndex });
        });
    });

    // Calculate total amount from all items
    const totalAmount = passengerRows.reduce((sum, row) => {
        return sum + (Number(row.item.total) || 0);
    }, 0);

    // Get currency from first invoice (assuming all invoices use same currency)
    const currency = invoices[0]?.details.currency || "USD";

    // Load clients when modal opens
    useEffect(() => {
        if (open) {
            fetchClients();
            // Set initial client if provided
            if (initialClientId) {
                setSelectedClientId(initialClientId);
            }
            if (initialClientEmail) {
                setSelectedClientEmail(initialClientEmail);
            }
        }
    }, [open, initialClientId, initialClientEmail]);

    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            const response = await fetch("/api/client/list");
            if (response.ok) {
                const data = await response.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleClientChange = (clientId: string) => {
        setSelectedClientId(clientId);
        const client = clients.find((c) => c.id === clientId);
        if (client) {
            setSelectedClientEmail(client.email);
        } else {
            setSelectedClientEmail("");
        }
    };

    // Format date like "21-Dec-22"
    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/invoice/statement", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    invoices,
                    billedToName: billedToName.trim() || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate statement");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `statement-${new Date().toISOString().split("T")[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error generating statement:", error);
            alert("Failed to generate statement. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!selectedClientId) {
            alert("Please select a client to save the statement");
            return;
        }

        if (!billedToName.trim()) {
            alert("Please enter a 'Billed To' name");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/statement/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    invoices,
                    title: "STATEMENT",
                    clientId: selectedClientId,
                    clientEmail: selectedClientEmail,
                    billedToName: billedToName.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save statement");
            }

            const data = await response.json();
            alert("Statement saved successfully!");
            
            if (onSaveSuccess) {
                onSaveSuccess();
            }
            
            // Close modal after successful save
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving statement:", error);
            alert("Failed to save statement. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw]">
                <DialogHeader className="pb-2 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-2xl uppercase">Statement Preview</DialogTitle>
                            <DialogDescription className="mt-2">
                                Preview of {invoices.length} selected invoice{invoices.length !== 1 ? 's' : ''}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <BaseButton
                                onClick={handleSave}
                                disabled={isSaving || !selectedClientId}
                                variant="outline"
                                size="sm"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Statement"}
                            </BaseButton>
                            <BaseButton
                                onClick={handleDownload}
                                disabled={isGenerating}
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isGenerating ? "Generating..." : "Download PDF"}
                            </BaseButton>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {/* Client Selector */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="client-select" className="text-sm font-semibold">
                            Select Client to Save Statement
                        </Label>
                        <Select
                            value={selectedClientId}
                            onValueChange={handleClientChange}
                            disabled={loadingClients}
                        >
                            <SelectTrigger id="client-select" className="w-full">
                                <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name} ({client.email})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Billed To Name Input */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="billed-to-name" className="text-sm font-semibold">
                            Billed To Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="billed-to-name"
                            type="text"
                            placeholder="Enter the name to display in 'Billed To' section"
                            value={billedToName}
                            onChange={(e) => setBilledToName(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    {/* Table */}
                    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-200 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase border-r border-gray-300 dark:border-gray-700 whitespace-nowrap">
                                            DATE
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase border-r border-gray-300 dark:border-gray-700 whitespace-nowrap">
                                            INVOICE NO
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase border-r border-gray-300 dark:border-gray-700 whitespace-nowrap">
                                            NAME
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase border-r border-gray-300 dark:border-gray-700 whitespace-nowrap">
                                            ROUTE
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase whitespace-nowrap">
                                            AMOUNT
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {passengerRows.map((row, index) => {
                                        const invoice = row.invoice;
                                        const item = row.item;
                                        
                                        const invoiceDate = new Date(invoice.details.invoiceDate);
                                        const formattedDate = formatDate(invoiceDate);

                                        // Get route from this specific item's description, service type, or name
                                        const route = item.description || item.serviceType || item.name || "-";

                                        // Get passenger name from this specific item
                                        const passengerName = item.passengerName || "-";

                                        return (
                                            <tr
                                                key={`${invoice.details.invoiceNumber}-${row.itemIndex}`}
                                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800/50 bg-white dark:bg-gray-900"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700 whitespace-nowrap">
                                                    {formattedDate}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700 whitespace-nowrap">
                                                    {invoice.details.invoiceNumber || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">
                                                    {passengerName}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">
                                                    {route}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right font-medium whitespace-nowrap">
                                                    {formatNumberWithCommas(Number(item.total) || 0)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Total Row */}
                                    <tr className="bg-gray-200 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-700 font-bold">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700" colSpan={3}></td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-300 dark:border-gray-700">
                                            TOTAL
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right whitespace-nowrap">
                                            {formatNumberWithCommas(totalAmount)} {currency}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        <p>Total Invoices: {invoices.length} | Total Amount: {formatNumberWithCommas(totalAmount)} {currency}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StatementPreviewModal;

