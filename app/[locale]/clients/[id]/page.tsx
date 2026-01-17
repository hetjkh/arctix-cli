"use client";

import ClientDetail from "@/app/components/client/ClientDetail";
import { use } from "react";

export default function ClientDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <ClientDetail clientId={id} />
        </div>
    );
}

