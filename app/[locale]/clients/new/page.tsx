"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ClientForm from "@/app/components/client/ClientForm";
import { ClientSchema } from "@/lib/schemas";
import { z } from "zod";

type ClientFormData = z.infer<typeof ClientSchema>;

export default function NewClientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: ClientFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/client/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push("/clients");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to create client");
            }
        } catch (error) {
            console.error("Error creating client:", error);
            alert("Error creating client");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">New Client</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Add a new client to your database
                </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow">
                <ClientForm
                    onSubmit={handleSubmit}
                    onCancel={() => router.push("/clients")}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}

