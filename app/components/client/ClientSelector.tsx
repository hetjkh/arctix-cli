"use client";

import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormContext } from "react-hook-form";

interface Client {
    id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    country?: string;
    address?: string;
    zipCode?: string;
}

interface ClientSelectorProps {
    onClientSelect?: (client: Client) => void;
}

const ClientSelector = ({ onClientSelect }: ClientSelectorProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setValue, watch } = useFormContext();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const selectedClientId = watch("clientId");
    const clientIdFromUrl = searchParams?.get("clientId");

    useEffect(() => {
        fetchClients();
    }, []);

    // Handle client pre-population from URL query param
    useEffect(() => {
        if (clientIdFromUrl && clients.length > 0 && !selectedClientId) {
            const client = clients.find((c) => c.id === clientIdFromUrl);
            if (client) {
                populateClientData(client);
                setValue("clientId", client.id);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientIdFromUrl, clients, selectedClientId]);

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

    const populateClientData = (client: Client) => {
        // Populate receiver fields with client data
        setValue("receiver.name", client.name);
        setValue("receiver.email", client.email);
        if (client.phone) setValue("receiver.phone", client.phone);
        if (client.city) setValue("receiver.city", client.city);
        if (client.country) setValue("receiver.country", client.country);
        if (client.address) {
            // Note: Invoice schema doesn't have address field in receiver, but we can add it to customInputs if needed
        }

        if (onClientSelect) {
            onClientSelect(client);
        }
    };

    const handleClientChange = (clientId: string) => {
        const client = clients.find((c) => c.id === clientId);
        if (client) {
            populateClientData(client);
            setValue("clientId", client.id);
        }
    };

    return (
        <div className="flex gap-2 items-center">
            <Select
                value={selectedClientId || ""}
                onValueChange={handleClientChange}
                disabled={loading || clients.length === 0}
            >
                <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder={loading ? "Loading..." : "Select a client"} />
                </SelectTrigger>
                <SelectContent>
                    {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                            {client.name} ({client.email})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/clients/new")}
            >
                <Plus className="w-4 h-4 mr-2" />
                New Client
            </Button>
        </div>
    );
};

export default ClientSelector;

