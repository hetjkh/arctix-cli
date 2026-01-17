"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Components
import { BaseButton } from "@/app/components";

// Icons
import { Plus, Search, Mail, Phone, MapPin, FileText, Edit, Trash2, Eye } from "lucide-react";

// Types
import { ClientInput } from "@/models/Client";

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

interface ClientListProps {
    onCreateInvoice?: (client: Client) => void;
}

const ClientList = ({ onCreateInvoice }: ClientListProps) => {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await fetch("/api/client/list");
            if (response.ok) {
                const data = await response.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this client?")) {
            return;
        }

        try {
            const response = await fetch(`/api/client/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setClients(clients.filter((c) => c.id !== id));
            } else {
                alert("Failed to delete client");
            }
        } catch (error) {
            console.error("Error deleting client:", error);
            alert("Error deleting client");
        }
    };

    const filteredClients = clients.filter((client) => {
        const query = searchQuery.toLowerCase();
        return (
            client.name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query) ||
            client.phone?.toLowerCase().includes(query) ||
            client.city?.toLowerCase().includes(query) ||
            client.country?.toLowerCase().includes(query) ||
            client.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Loading clients...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search clients by name, email, phone, city, country, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <BaseButton
                    onClick={() => router.push("/clients/new")}
                    tooltipLabel="Add new client"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Client
                </BaseButton>
            </div>

            {filteredClients.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500">
                            {searchQuery
                                ? "No clients found matching your search."
                                : "No clients yet. Create your first client to get started."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => (
                        <Card key={client.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{client.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Mail className="w-3 h-3" />
                                            {client.email}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <BaseButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/clients/${client.id}`)}
                                            tooltipLabel="View details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </BaseButton>
                                        <BaseButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/clients/${client.id}/edit`)}
                                            tooltipLabel="Edit client"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </BaseButton>
                                        <BaseButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(client.id)}
                                            tooltipLabel="Delete client"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </BaseButton>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Phone className="w-4 h-4" />
                                        {client.phone}
                                    </div>
                                )}
                                {(client.city || client.country) && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-4 h-4" />
                                        {[client.city, client.country].filter(Boolean).join(", ")}
                                    </div>
                                )}
                                {client.tags && client.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {client.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => router.push(`/clients/${client.id}`)}
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        View History
                                    </Button>
                                    {onCreateInvoice && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => onCreateInvoice(client)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Invoice
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientList;

