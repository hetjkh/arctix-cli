"use client";

import ClientList from "@/app/components/client/ClientList";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
    const router = useRouter();

    const handleCreateInvoice = (client: any) => {
        router.push(`/?clientId=${client.id}`);
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Clients</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your clients and create invoices quickly
                </p>
            </div>
            <ClientList onCreateInvoice={handleCreateInvoice} />
        </div>
    );
}

