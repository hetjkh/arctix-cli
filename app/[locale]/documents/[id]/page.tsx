"use client";

import { use } from "react";
import DocumentVersionHistory from "@/app/components/document/DocumentVersionHistory";

export default function DocumentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <DocumentVersionHistory documentId={id} />
        </div>
    );
}

