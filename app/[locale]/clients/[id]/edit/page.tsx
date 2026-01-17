"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import ClientForm from "@/app/components/client/ClientForm";
import { ClientSchema } from "@/lib/schemas";
import { z } from "zod";

type ClientFormData = z.infer<typeof ClientSchema>;

export default function EditClientPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [client, setClient] = useState<ClientFormData & { id?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingClient, setLoadingClient] = useState(true);

    useEffect(() => {
        fetchClient();
    }, [id]);

    const fetchClient = async () => {
        try {
            const response = await fetch(`/api/client/${id}`);
            if (response.ok) {
                const data = await response.json();
                setClient(data.client);
            } else {
                alert("Failed to load client");
                router.push("/clients");
            }
        } catch (error) {
            console.error("Error fetching client:", error);
            alert("Error loading client");
        } finally {
            setLoadingClient(false);
        }
    };

    const handleSubmit = async (data: ClientFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/client/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push(`/clients/${id}`);
            } else {
                const error = await response.json();
                alert(error.error || "Failed to update client");
            }
        } catch (error) {
            console.error("Error updating client:", error);
            alert("Error updating client");
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingClient) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="flex justify-center items-center p-8">
                    <p>Loading client...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return null;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Edit Client</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Update client information
                </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow">
                <ClientForm
                    client={client}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push(`/clients/${id}`)}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}

