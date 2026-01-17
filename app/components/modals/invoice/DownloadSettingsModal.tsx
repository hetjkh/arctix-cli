"use client";

import { useState, useEffect } from "react";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Components
import { BaseButton } from "@/app/components";

// Variables
import { LOCAL_STORAGE_DOWNLOAD_DIRECTORY_KEY } from "@/lib/variables";

// Services
import { setDownloadDirectory as setDownloadDirectoryHandle } from "@/services/invoice/client/downloadToDirectory";

// Icons
import { FolderOpen, Settings } from "lucide-react";

type DownloadSettingsModalType = {
    children: React.ReactNode;
};

const DownloadSettingsModal = ({ children }: DownloadSettingsModalType) => {
    const [open, setOpen] = useState(false);
    const [downloadDirectory, setDownloadDirectory] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    // Check if File System Access API is supported
    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsSupported("showDirectoryPicker" in window);
            
            // Load saved directory preference
            const saved = localStorage.getItem(LOCAL_STORAGE_DOWNLOAD_DIRECTORY_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setDownloadDirectory(parsed.name || null);
                } catch {
                    setDownloadDirectory(null);
                }
            }
        }
    }, []);

    const handleChooseDirectory = async () => {
        if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
            alert("File System Access API is not supported in your browser. Downloads will use your browser's default download location.");
            return;
        }

        try {
            // @ts-ignore - File System Access API types may not be available
            const handle = await window.showDirectoryPicker({
                mode: "readwrite",
            });

            // Store directory handle in session (in-memory)
            setDownloadDirectoryHandle(handle);

            // Store directory handle info (we can't store the handle itself, but we can remember the name)
            const directoryInfo = {
                name: handle.name,
                // Note: We can't persist the handle, but we'll use it for the current session
            };

            localStorage.setItem(
                LOCAL_STORAGE_DOWNLOAD_DIRECTORY_KEY,
                JSON.stringify(directoryInfo)
            );

            // Update the UI state
            setDownloadDirectory(handle.name);
        } catch (error: any) {
            // User cancelled or error occurred
            if (error.name !== "AbortError") {
                console.error("Error selecting directory:", error);
                alert("Failed to select directory. Please try again.");
            }
        }
    };

    const handleClearDirectory = () => {
        localStorage.removeItem(LOCAL_STORAGE_DOWNLOAD_DIRECTORY_KEY);
        // Clear the in-memory handle
        setDownloadDirectoryHandle(null);
        // Update the UI state
        setDownloadDirectory(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Download Settings</DialogTitle>
                    <DialogDescription>
                        Choose a default download location for your invoices. Once set, files will be saved to this location automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!isSupported && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                File System Access API is not supported in your browser. Downloads will use your browser's default download location.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="flex items-center gap-2">
                                <FolderOpen className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {downloadDirectory ? "Selected Directory:" : "No directory selected"}
                                    </p>
                                    {downloadDirectory && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {downloadDirectory}
                                        </p>
                                    )}
                                    {!downloadDirectory && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Files will download to your browser's default location
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <BaseButton
                            onClick={handleChooseDirectory}
                            variant="outline"
                            className="flex-1"
                            disabled={!isSupported}
                        >
                            <FolderOpen className="w-4 h-4" />
                            {downloadDirectory ? "Change Directory" : "Choose Directory"}
                        </BaseButton>
                        
                        {downloadDirectory && (
                            <BaseButton
                                onClick={handleClearDirectory}
                                variant="outline"
                            >
                                Clear
                            </BaseButton>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                        <p>
                            Note: The directory preference is saved in your browser. You'll need to select it again if you clear your browser data.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DownloadSettingsModal;

