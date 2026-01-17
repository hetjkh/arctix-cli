"use client";

import React, { useState, useMemo } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Components
import { BaseButton } from "@/app/components";
import StatementPreviewModal from "@/app/components/modals/invoice/StatementPreviewModal";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS, FORM_DEFAULT_VALUES } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

// Icons
import { CalendarIcon, X, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type SavedInvoicesListProps = {
    setModalState: React.Dispatch<React.SetStateAction<boolean>>;
};

type FilterType = "all" | "sender" | "receiver";
type SortType = 
    | "date-desc" 
    | "date-asc" 
    | "month-desc" 
    | "month-asc" 
    | "year-desc" 
    | "year-asc"
    | "amount-desc"
    | "amount-asc"
    | "invoice-number"
    | "sender-name"
    | "receiver-name";

type GroupByType = "none" | "date" | "month" | "year" | "sender" | "receiver" | "currency";

const SavedInvoicesList = ({ setModalState }: SavedInvoicesListProps) => {
    const { savedInvoices, onFormSubmit, deleteInvoice } = useInvoiceContext();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<FilterType>("all");
    const [sortType, setSortType] = useState<SortType>("date-desc");
    const [groupBy, setGroupBy] = useState<GroupByType>("none");
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
    const [amountMin, setAmountMin] = useState<string>("");
    const [amountMax, setAmountMax] = useState<string>("");
    const [selectedCurrency, setSelectedCurrency] = useState<string>("all");
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<number>>(new Set());
    const [showStatementPreview, setShowStatementPreview] = useState(false);

    const { reset } = useFormContext<InvoiceType>();

    // TODO: Remove "any" from the function below
    // Update fields when selected invoice is changed.
    // ? Reason: The fields don't go through validation when invoice loads
    const updateFields = (selected: any) => {
        // Migrate phone from string to array for backward compatibility
        if (selected?.sender?.phone && typeof selected.sender.phone === "string") {
            selected.sender.phone = selected.sender.phone ? [selected.sender.phone] : [""];
        } else if (!selected?.sender?.phone || !Array.isArray(selected.sender.phone)) {
            selected.sender.phone = [""];
        }
        if (selected?.receiver?.phone && typeof selected.receiver.phone === "string") {
            selected.receiver.phone = selected.receiver.phone ? [selected.receiver.phone] : [""];
        } else if (!selected?.receiver?.phone || !Array.isArray(selected.receiver.phone)) {
            selected.receiver.phone = [""];
        }
        // Remove database-specific fields
        if (selected.id) {
            delete selected.id;
        }
        if (selected._id) {
            delete selected._id;
        }
        if (selected.userId) {
            delete selected.userId;
        }
        if (selected.createdAt) {
            delete selected.createdAt;
        }

        // Next 2 lines are so that when invoice loads,
        // the dates won't be in the wrong format
        // ? Selected cannot be of type InvoiceType because of these 2 variables
        if (selected.details.dueDate) {
            selected.details.dueDate = new Date(selected.details.dueDate);
        }
        if (selected.details.invoiceDate) {
            selected.details.invoiceDate = new Date(selected.details.invoiceDate);
        }

        // Use default logo if not present
        if (!selected.details.invoiceLogo || selected.details.invoiceLogo.trim() === "") {
            selected.details.invoiceLogo = FORM_DEFAULT_VALUES.details.invoiceLogo;
        }
        // Use default signature if not present
        if (!selected.details.signature?.data || selected.details.signature.data.trim() === "") {
            selected.details.signature = FORM_DEFAULT_VALUES.details.signature;
        }
    };

    /**
     * Transform date values for next submission
     *
     * @param {InvoiceType} selected - The selected invoice
     */
    const transformDates = (selected: InvoiceType) => {
        if (selected.details.dueDate) {
            selected.details.dueDate = new Date(
                selected.details.dueDate
            ).toLocaleDateString("en-US", DATE_OPTIONS);
        }
        selected.details.invoiceDate = new Date(
            selected.details.invoiceDate
        ).toLocaleDateString("en-US", DATE_OPTIONS);
    };

    /**
     * Loads a given invoice into the form.
     *
     * @param {InvoiceType} selectedInvoice - The selected invoice
     */
    const load = (selectedInvoice: InvoiceType) => {
        if (selectedInvoice) {
            updateFields(selectedInvoice);
            reset(selectedInvoice);
            transformDates(selectedInvoice);

            // Close modal
            setModalState(false);
        }
    };

    /**
     * Loads a given invoice into the form and generates a pdf by submitting the form.
     *
     * @param {InvoiceType} selectedInvoice - The selected invoice
     */
    const loadAndGeneratePdf = (selectedInvoice: InvoiceType) => {
        load(selectedInvoice);

        // Submit form
        onFormSubmit(selectedInvoice);
    };

    // Get unique sender and receiver names for filter dropdown
    const uniqueSenders = useMemo(() => {
        const senders = new Set<string>();
        savedInvoices.forEach((invoice) => {
            if (invoice.sender.name) {
                senders.add(invoice.sender.name);
            }
        });
        return Array.from(senders).sort();
    }, [savedInvoices]);

    const uniqueReceivers = useMemo(() => {
        const receivers = new Set<string>();
        savedInvoices.forEach((invoice) => {
            if (invoice.receiver.name) {
                receivers.add(invoice.receiver.name);
            }
        });
        return Array.from(receivers).sort();
    }, [savedInvoices]);

    const uniqueCurrencies = useMemo(() => {
        const currencies = new Set<string>();
        savedInvoices.forEach((invoice) => {
            if (invoice.details.currency) {
                currencies.add(invoice.details.currency);
            }
        });
        return Array.from(currencies).sort();
    }, [savedInvoices]);

    // Helper function to parse invoice date
    const parseInvoiceDate = (invoice: InvoiceType): Date => {
        if (invoice.details.invoiceDate) {
            const date = new Date(invoice.details.invoiceDate);
            return isNaN(date.getTime()) ? new Date(0) : date;
        }
        return new Date(0);
    };

    // Helper function to get month from date
    const getMonthKey = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    // Helper function to get year from date
    const getYearKey = (date: Date): string => {
        return String(date.getFullYear());
    };

    // Filter invoices based on search query, filter type, date range, amount range, and currency
    const filteredInvoices = useMemo(() => {
        let filtered = savedInvoices.map((invoice, idx) => ({ invoice, originalIdx: idx }));

        // Apply filter type (sender/receiver)
        if (filterType === "sender" && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(({ invoice }) => {
                const senderName = invoice.sender.name?.toLowerCase() || "";
                return senderName.includes(query);
            });
        } else if (filterType === "receiver" && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(({ invoice }) => {
                const receiverName = invoice.receiver.name?.toLowerCase() || "";
                return receiverName.includes(query);
            });
        } else if (searchQuery.trim()) {
            // General search across all fields
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(({ invoice }) => {
                const invoiceNumber = invoice.details.invoiceNumber?.toLowerCase() || "";
                const senderName = invoice.sender.name?.toLowerCase() || "";
                const receiverName = invoice.receiver.name?.toLowerCase() || "";
                
                return (
                    invoiceNumber.includes(query) ||
                    senderName.includes(query) ||
                    receiverName.includes(query)
                );
            });
        }

        // Apply date range filter
        if (dateFrom || dateTo) {
            filtered = filtered.filter(({ invoice }) => {
                const invoiceDate = parseInvoiceDate(invoice);
                if (dateFrom && invoiceDate < dateFrom) return false;
                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999); // Include entire day
                    if (invoiceDate > toDate) return false;
                }
                return true;
            });
        }

        // Apply amount range filter
        if (amountMin || amountMax) {
            filtered = filtered.filter(({ invoice }) => {
                const amount = Number(invoice.details.totalAmount) || 0;
                if (amountMin && amount < Number(amountMin)) return false;
                if (amountMax && amount > Number(amountMax)) return false;
                return true;
            });
        }

        // Apply currency filter
        if (selectedCurrency !== "all") {
            filtered = filtered.filter(({ invoice }) => {
                return invoice.details.currency === selectedCurrency;
            });
        }

        return filtered;
    }, [savedInvoices, searchQuery, filterType, dateFrom, dateTo, amountMin, amountMax, selectedCurrency]);

    // Sort invoices
    const sortedInvoices = useMemo(() => {
        const sorted = [...filteredInvoices];
        
        sorted.sort((a, b) => {
            const invoiceA = a.invoice;
            const invoiceB = b.invoice;

            switch (sortType) {
                case "date-desc":
                    return parseInvoiceDate(invoiceB).getTime() - parseInvoiceDate(invoiceA).getTime();
                case "date-asc":
                    return parseInvoiceDate(invoiceA).getTime() - parseInvoiceDate(invoiceB).getTime();
                case "month-desc":
                    return getMonthKey(parseInvoiceDate(invoiceB)).localeCompare(getMonthKey(parseInvoiceDate(invoiceA)));
                case "month-asc":
                    return getMonthKey(parseInvoiceDate(invoiceA)).localeCompare(getMonthKey(parseInvoiceDate(invoiceB)));
                case "year-desc":
                    return getYearKey(parseInvoiceDate(invoiceB)).localeCompare(getYearKey(parseInvoiceDate(invoiceA)));
                case "year-asc":
                    return getYearKey(parseInvoiceDate(invoiceA)).localeCompare(getYearKey(parseInvoiceDate(invoiceB)));
                case "amount-desc":
                    return (Number(invoiceB.details.totalAmount) || 0) - (Number(invoiceA.details.totalAmount) || 0);
                case "amount-asc":
                    return (Number(invoiceA.details.totalAmount) || 0) - (Number(invoiceB.details.totalAmount) || 0);
                case "invoice-number":
                    return (invoiceA.details.invoiceNumber || "").localeCompare(invoiceB.details.invoiceNumber || "");
                case "sender-name":
                    return (invoiceA.sender.name || "").localeCompare(invoiceB.sender.name || "");
                case "receiver-name":
                    return (invoiceA.receiver.name || "").localeCompare(invoiceB.receiver.name || "");
                default:
                    return 0;
            }
        });

        return sorted;
    }, [filteredInvoices, sortType]);

    // Group invoices
    const groupedInvoices = useMemo(() => {
        if (groupBy === "none") {
            return { "All Invoices": sortedInvoices };
        }

        const groups: Record<string, typeof sortedInvoices> = {};
        const groupOrder: Record<string, number> = {}; // For sorting groups

        sortedInvoices.forEach((item) => {
            let key: string;
            let sortKey: number = 0;
            const invoice = item.invoice;
            const date = parseInvoiceDate(invoice);

            switch (groupBy) {
                case "date":
                    key = date.toLocaleDateString("en-US", DATE_OPTIONS);
                    sortKey = date.getTime();
                    break;
                case "month":
                    // Format: "January 2024", "February 2024", etc.
                    key = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
                    // Sort key: year * 100 + month (e.g., 202401 for January 2024)
                    sortKey = date.getFullYear() * 100 + date.getMonth() + 1;
                    break;
                case "year":
                    key = getYearKey(date);
                    sortKey = date.getFullYear();
                    break;
                case "sender":
                    key = invoice.sender.name || "Unknown Sender";
                    sortKey = 0;
                    break;
                case "receiver":
                    key = invoice.receiver.name || "Unknown Receiver";
                    sortKey = 0;
                    break;
                case "currency":
                    key = invoice.details.currency || "Unknown Currency";
                    sortKey = 0;
                    break;
                default:
                    key = "All Invoices";
                    sortKey = 0;
            }

            if (!groups[key]) {
                groups[key] = [];
                groupOrder[key] = sortKey;
            }
            groups[key].push(item);
        });

        // Sort groups by their sort key for chronological ordering
        if (groupBy === "month" || groupBy === "year" || groupBy === "date") {
            const sortedGroups: Record<string, typeof sortedInvoices> = {};
            Object.keys(groups)
                .sort((a, b) => {
                    if (groupBy === "month" || groupBy === "year" || groupBy === "date") {
                        return groupOrder[b] - groupOrder[a]; // Descending (newest first)
                    }
                    return a.localeCompare(b);
                })
                .forEach((key) => {
                    sortedGroups[key] = groups[key];
                });
            return sortedGroups;
        }

        return groups;
    }, [sortedInvoices, groupBy]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalInvoices = filteredInvoices.length;
        const totalAmount = filteredInvoices.reduce((sum, { invoice }) => {
            return sum + (Number(invoice.details.totalAmount) || 0);
        }, 0);
        const currencies = new Set(filteredInvoices.map(({ invoice }) => invoice.details.currency));
        
        return {
            totalInvoices,
            totalAmount,
            uniqueCurrencies: currencies.size,
        };
    }, [filteredInvoices]);

    const clearFilters = () => {
        setSearchQuery("");
        setFilterType("all");
        setDateFrom(undefined);
        setDateTo(undefined);
        setAmountMin("");
        setAmountMax("");
        setSelectedCurrency("all");
    };

    /**
     * Toggle selection of an invoice
     */
    const toggleInvoiceSelection = (originalIdx: number) => {
        setSelectedInvoiceIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(originalIdx)) {
                newSet.delete(originalIdx);
            } else {
                newSet.add(originalIdx);
            }
            return newSet;
        });
    };

    /**
     * Select all visible invoices
     */
    const selectAllInvoices = () => {
        const allIndices = new Set(sortedInvoices.map(({ originalIdx }) => originalIdx));
        setSelectedInvoiceIds(allIndices);
    };

    /**
     * Deselect all invoices
     */
    const deselectAllInvoices = () => {
        setSelectedInvoiceIds(new Set());
    };

    /**
     * Show statement preview for selected invoices
     */
    const showStatementPreviewModal = () => {
        if (selectedInvoiceIds.size === 0) return;
        setShowStatementPreview(true);
    };

    /**
     * Get selected invoices
     */
    const getSelectedInvoices = (): InvoiceType[] => {
        return Array.from(selectedInvoiceIds)
            .map((idx) => savedInvoices[idx])
            .filter(Boolean);
    };

    const renderInvoiceCard = (invoice: InvoiceType, originalIdx: number, key: string | number) => {
        const isSelected = selectedInvoiceIds.has(originalIdx);
        return (
            <Card
                key={key}
                className={cn(
                    "p-2 border rounded-sm hover:border-blue-500 hover:shadow-lg cursor-pointer",
                    isSelected && "border-blue-600 border-2 bg-blue-100/50 dark:bg-blue-900/20"
                )}
            >
                <CardContent className="flex justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleInvoiceSelection(originalIdx)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                        />
                        <div className={cn("flex-1", isSelected && "text-gray-900 dark:text-gray-100")}>
                            <p className="font-semibold">
                                Invoice #{invoice.details.invoiceNumber}{" "}
                            </p>
                            <small className={cn("text-gray-500", isSelected && "dark:text-gray-300")}>
                                Date: {parseInvoiceDate(invoice).toLocaleDateString("en-US", DATE_OPTIONS)} | 
                                Updated: {invoice.details.updatedAt || "N/A"}
                            </small>

                            <div className="mt-2">
                                <p>Sender: {invoice.sender.name}</p>
                                <p>Receiver: {invoice.receiver.name}</p>
                                <p>
                                    Total:{" "}
                                    <span className="font-semibold">
                                        {formatNumberWithCommas(
                                            Number(invoice.details.totalAmount)
                                        )}{" "}
                                        {invoice.details.currency}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <BaseButton
                            tooltipLabel="Load invoice details into the form"
                            variant="outline"
                            size="sm"
                            onClick={() => load(invoice)}
                        >
                            Load
                        </BaseButton>

                        <BaseButton
                            tooltipLabel="Load invoice and generate PDF"
                            variant="outline"
                            size="sm"
                            onClick={() => loadAndGeneratePdf(invoice)}
                        >
                            Load & Generate
                        </BaseButton>
                        <BaseButton
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteInvoice(originalIdx);
                            }}
                        >
                            Delete
                        </BaseButton>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            <Tabs defaultValue="filters" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="filters">Filters & Search</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="filters" className="space-y-3">
                    {/* Statistics Bar */}
                    <div className="flex gap-2 flex-wrap items-center p-2 bg-muted rounded-md">
                        <Badge variant="secondary">
                            {statistics.totalInvoices} Invoice{statistics.totalInvoices !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="secondary">
                            Total: {formatNumberWithCommas(statistics.totalAmount)}
                        </Badge>
                        <Badge variant="secondary">
                            {statistics.uniqueCurrencies} Currency{statistics.uniqueCurrencies !== 1 ? 's' : ''}
                        </Badge>
                        {selectedInvoiceIds.size > 0 && (
                            <Badge variant="default" className="bg-blue-600">
                                {selectedInvoiceIds.size} Selected
                            </Badge>
                        )}
                        {(searchQuery || filterType !== "all" || dateFrom || dateTo || amountMin || amountMax || selectedCurrency !== "all") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="ml-auto"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Selection Actions */}
                    {selectedInvoiceIds.size > 0 && (
                        <div className="flex gap-2 items-center p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-md border border-blue-300 dark:border-blue-700">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {selectedInvoiceIds.size} invoice{selectedInvoiceIds.size !== 1 ? 's' : ''} selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={deselectAllInvoices}
                            >
                                Deselect All
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={showStatementPreviewModal}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Preview Statement
                            </Button>
                        </div>
                    )}

                    {/* Select All Button */}
                    {sortedInvoices.length > 0 && selectedInvoiceIds.size < sortedInvoices.length && (
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={selectAllInvoices}
                                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Select All
                            </Button>
                        </div>
                    )}

                    {/* Search and Filter Row */}
                    <div className="flex gap-2 flex-wrap">
                        <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Invoices</SelectItem>
                                <SelectItem value="sender">Filter by Sender</SelectItem>
                                <SelectItem value="receiver">Filter by Receiver</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="text"
                            placeholder={
                                filterType === "sender"
                                    ? "Search by sender name..."
                                    : filterType === "receiver"
                                    ? "Search by receiver name..."
                                    : "Search by invoice number, sender name, or receiver name..."
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 min-w-[200px]"
                        />
                    </div>

                    {/* Quick Filter Buttons */}
                    {filterType === "sender" && uniqueSenders.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {uniqueSenders.map((sender) => (
                                <BaseButton
                                    key={sender}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchQuery(sender)}
                                    className="text-xs"
                                >
                                    {sender}
                                </BaseButton>
                            ))}
                        </div>
                    )}
                    {filterType === "receiver" && uniqueReceivers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {uniqueReceivers.map((receiver) => (
                                <BaseButton
                                    key={receiver}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchQuery(receiver)}
                                    className="text-xs"
                                >
                                    {receiver}
                                </BaseButton>
                            ))}
                        </div>
                    )}

                    {/* Advanced Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Date Range */}
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateFrom && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFrom ? dateFrom.toLocaleDateString() : "From Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateFrom}
                                        onSelect={setDateFrom}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {dateFrom && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDateFrom(undefined)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateTo && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateTo ? dateTo.toLocaleDateString() : "To Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateTo}
                                        onSelect={setDateTo}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {dateTo && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDateTo(undefined)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Amount Range */}
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min Amount"
                                value={amountMin}
                                onChange={(e) => setAmountMin(e.target.value)}
                                className="w-full"
                            />
                            <Input
                                type="number"
                                placeholder="Max Amount"
                                value={amountMax}
                                onChange={(e) => setAmountMax(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Currency Filter */}
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Currencies</SelectItem>
                                {uniqueCurrencies.map((currency) => (
                                    <SelectItem key={currency} value={currency}>
                                        {currency}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sort Options */}
                        <Select value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                                <SelectItem value="month-desc">Month (Newest First)</SelectItem>
                                <SelectItem value="month-asc">Month (Oldest First)</SelectItem>
                                <SelectItem value="year-desc">Year (Newest First)</SelectItem>
                                <SelectItem value="year-asc">Year (Oldest First)</SelectItem>
                                <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                                <SelectItem value="invoice-number">Invoice Number</SelectItem>
                                <SelectItem value="sender-name">Sender Name</SelectItem>
                                <SelectItem value="receiver-name">Receiver Name</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Group By */}
                        <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupByType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Group by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Grouping</SelectItem>
                                <SelectItem value="date">Group by Date</SelectItem>
                                <SelectItem value="month">Group by Month</SelectItem>
                                <SelectItem value="year">Group by Year</SelectItem>
                                <SelectItem value="sender">Group by Sender</SelectItem>
                                <SelectItem value="receiver">Group by Receiver</SelectItem>
                                <SelectItem value="currency">Group by Currency</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </TabsContent>

                <TabsContent value="statistics" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{statistics.totalInvoices}</div>
                                <p className="text-xs text-muted-foreground">Total Invoices</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">
                                    {formatNumberWithCommas(statistics.totalAmount)}
                                </div>
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{statistics.uniqueCurrencies}</div>
                                <p className="text-xs text-muted-foreground">Unique Currencies</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-5 overflow-y-auto max-h-[60vh] mt-4">
                {groupBy === "none" ? (
                    sortedInvoices.map(({ invoice, originalIdx }, idx) =>
                        renderInvoiceCard(invoice, originalIdx, idx)
                    )
                ) : (
                    Object.entries(groupedInvoices).map(([groupKey, invoices]) => (
                        <div key={groupKey} className="space-y-3">
                            <div className="sticky top-0 bg-background z-10 py-2 border-b">
                                <h3 className="font-semibold text-lg">
                                    {groupKey} <Badge variant="secondary">{invoices.length}</Badge>
                                </h3>
                            </div>
                            {invoices.map(({ invoice, originalIdx }, idx) =>
                                renderInvoiceCard(invoice, originalIdx, `${groupKey}-${idx}`)
                            )}
                        </div>
                    ))
                )}

                {savedInvoices.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No saved invoices</p>
                    </div>
                )}

                {savedInvoices.length > 0 && sortedInvoices.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No invoices found matching your filters</p>
                    </div>
                )}
            </div>

            {/* Statement Preview Modal */}
            <StatementPreviewModal
                open={showStatementPreview}
                onOpenChange={(open) => {
                    setShowStatementPreview(open);
                    if (!open) {
                        // Clear selection when modal closes
                        setSelectedInvoiceIds(new Set());
                    }
                }}
                invoices={getSelectedInvoices()}
            />
        </>
    );
};

export default SavedInvoicesList;
