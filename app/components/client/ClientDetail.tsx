"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ShadCn
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Components
import { BaseButton } from "@/app/components";

// Icons
import { Mail, Phone, MapPin, FileText, Edit, ArrowLeft, Plus, X } from "lucide-react";

interface Client {
    id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    country?: string;
    address?: string;
    zipCode?: string;
    notes?: string;
    tags?: string[];
}

interface Invoice {
    id: string;
    details: {
        invoiceNumber: string;
        invoiceDate: string;
        totalAmount: number;
        currency: string;
    };
    receiver: {
        name: string;
        email: string;
    };
}

interface Statement {
    id: string;
    title?: string;
    invoices: Invoice[];
    createdAt: string;
    updatedAt: string;
}

interface ClientDetailProps {
    clientId: string;
}

const ClientDetail = ({ clientId }: ClientDetailProps) => {
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [statements, setStatements] = useState<Statement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClientDetails = useCallback(async () => {
        try {
            // Add timestamp to prevent caching
            const response = await fetch(`/api/client/${clientId}?t=${Date.now()}`, {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache",
                },
            });
            if (response.ok) {
                const data = await response.json();
                setClient(data.client);
                setInvoices(data.invoices || []);
                setStatements(data.statements || []);
            } else {
                alert("Failed to load client details");
                router.push("/clients");
            }
        } catch (error) {
            console.error("Error fetching client details:", error);
            alert("Error loading client details");
        } finally {
            setLoading(false);
        }
    }, [clientId, router]);

    useEffect(() => {
        fetchClientDetails();
    }, [fetchClientDetails]);

    // Refresh data when page becomes visible (user navigates back to this page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchClientDetails();
                router.refresh();
            }
        };

        const handleFocus = () => {
            fetchClientDetails();
            router.refresh();
        };

        // Listen for invoice deletion events to refresh client history
        const handleInvoiceDeleted = (event: Event) => {
            // Force refresh client details immediately when invoice is deleted
            fetchClientDetails();
            router.refresh();
        };

        // Listen for statement deletion events to refresh client history
        const handleStatementDeleted = (event: Event) => {
            // Force refresh client details immediately when statement is deleted
            fetchClientDetails();
            router.refresh();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("invoiceDeleted", handleInvoiceDeleted);
        window.addEventListener("statementDeleted", handleStatementDeleted);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("invoiceDeleted", handleInvoiceDeleted);
            window.removeEventListener("statementDeleted", handleStatementDeleted);
        };
    }, [fetchClientDetails, router]);

    const handleCreateInvoice = () => {
        if (client) {
            router.push(`/?clientId=${client.id}`);
        }
    };

    const handleDeleteStatement = async (statementId: string) => {
        if (!confirm("Are you sure you want to delete this statement?")) {
            return;
        }

        try {
            const response = await fetch(`/api/statement/${statementId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Refresh client details
                fetchClientDetails();
                // Dispatch event for other components
                window.dispatchEvent(new Event("statementDeleted"));
            } else {
                alert("Failed to delete statement");
            }
        } catch (error) {
            console.error("Error deleting statement:", error);
            alert("Error deleting statement");
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "USD",
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Loading client details...</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Client not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <BaseButton
                    variant="outline"
                    onClick={() => router.push("/clients")}
                    tooltipLabel="Back to clients"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Clients
                </BaseButton>
                <div className="flex gap-2">
                    <BaseButton
                        variant="outline"
                        onClick={() => router.push(`/clients/${clientId}/edit`)}
                        tooltipLabel="Edit client"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Client
                    </BaseButton>
                    <BaseButton
                        onClick={handleCreateInvoice}
                        tooltipLabel="Create new invoice for this client"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Invoice
                    </BaseButton>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{client.name}</CardTitle>
                    <CardDescription>Client Information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Email:</span>
                            <span className="text-sm">{client.email}</span>
                        </div>
                        {client.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Phone:</span>
                                <span className="text-sm">{client.phone}</span>
                            </div>
                        )}
                        {(client.city || client.country) && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Location:</span>
                                <span className="text-sm">
                                    {[client.city, client.country].filter(Boolean).join(", ")}
                                </span>
                            </div>
                        )}
                        {client.address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                                <div>
                                    <span className="text-sm font-medium">Address:</span>
                                    <p className="text-sm">
                                        {client.address}
                                        {client.zipCode && `, ${client.zipCode}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {client.tags && client.tags.length > 0 && (
                        <div>
                            <span className="text-sm font-medium">Tags:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {client.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {client.notes && (
                        <div>
                            <span className="text-sm font-medium">Notes:</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                                {client.notes}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>
                        {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} for this
                        client
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            No invoices found for this client.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice Number</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">
                                            #{invoice.details.invoiceNumber}
                                        </TableCell>
                                        <TableCell>{invoice.details.invoiceDate}</TableCell>
                                        <TableCell>
                                            {formatCurrency(
                                                invoice.details.totalAmount,
                                                invoice.details.currency
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.push(`/?invoiceId=${invoice.id}`)
                                                }
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Statement History</CardTitle>
                    <CardDescription>
                        {statements.length} {statements.length === 1 ? "statement" : "statements"} for this
                        client
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {statements.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                            No statements found for this client.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Invoices</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statements.map((statement) => {
                                    const totalAmount = statement.invoices.reduce(
                                        (sum, inv) => sum + (Number(inv.details?.totalAmount) || 0),
                                        0
                                    );
                                    const currency = statement.invoices[0]?.details?.currency || "USD";
                                    
                                    return (
                                        <TableRow key={statement.id}>
                                            <TableCell className="font-medium">
                                                {statement.title || "STATEMENT"}
                                            </TableCell>
                                            <TableCell>
                                                {statement.invoices.length} invoice{statement.invoices.length !== 1 ? 's' : ''} - {formatCurrency(totalAmount, currency)}
                                            </TableCell>
                                            <TableCell>{statement.createdAt}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            // Download statement PDF
                                                            window.open(`/api/statement/${statement.id}/download`, '_blank');
                                                        }}
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Download
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteStatement(statement.id)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ClientDetail;

