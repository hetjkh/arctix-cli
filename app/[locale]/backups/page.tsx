"use client";

import BackupList from "@/app/components/backup/BackupList";

export default function BackupsPage() {
    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Backups</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Create and manage backups of your data. Restore your data anytime you need.
                </p>
            </div>
            <BackupList />
        </div>
    );
}

