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
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// Components
import { BaseButton } from "@/app/components";

// Icons
import {
    Download,
    Trash2,
    RotateCcw,
    HardDrive,
    Plus,
    Calendar,
    FileArchive,
    Database,
    FileDown,
} from "lucide-react";

interface BackupMetadata {
    id: string;
    filename: string;
    userId: string;
    email: string;
    backupDate: string;
    fileSize: number;
    dataCounts: {
        clients: number;
        invoices: number;
        documents: number;
        statements: number;
        preferences: number;
        defaults: number;
    };
}

const BackupList = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [backups, setBackups] = useState<BackupMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [downloadingPdfZip, setDownloadingPdfZip] = useState(false);
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("Preparing to generate PDFs...");

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            const response = await fetch("/api/backup/list");
            if (response.ok) {
                const data = await response.json();
                setBackups(data.backups || []);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load backups",
                });
            }
        } catch (error) {
            console.error("Error fetching backups:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load backups",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setCreating(true);
        try {
            const response = await fetch("/api/backup/create", {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Success",
                    description: "Backup created successfully",
                });
                fetchBackups();
            } else {
                const error = await response.json();
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.error || "Failed to create backup",
                });
            }
        } catch (error) {
            console.error("Error creating backup:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create backup",
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const response = await fetch(`/api/backup/export-user?filename=${encodeURIComponent(filename)}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
                toast({
                    title: "Success",
                    description: "Backup downloaded successfully",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to download backup",
                });
            }
        } catch (error) {
            console.error("Error downloading backup:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to download backup",
            });
        }
    };

    const handleDelete = async (filename: string) => {
        try {
            const response = await fetch(`/api/backup/${encodeURIComponent(filename)}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Backup deleted successfully",
                });
                fetchBackups();
            } else {
                const error = await response.json();
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.error || "Failed to delete backup",
                });
            }
        } catch (error) {
            console.error("Error deleting backup:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete backup",
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleRestore = async () => {
        if (!restoringId) return;

        try {
            const response = await fetch("/api/backup/restore", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filename: restoringId,
                    mode: restoreMode,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Success",
                    description: `Backup restored successfully. Restored: ${JSON.stringify(data.result.restored)}`,
                });
                setShowRestoreDialog(false);
                setRestoringId(null);
                // Refresh the page to show updated data
                setTimeout(() => {
                    router.refresh();
                }, 1000);
            } else {
                const error = await response.json();
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.error || "Failed to restore backup",
                });
            }
        } catch (error) {
            console.error("Error restoring backup:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to restore backup",
            });
        } finally {
            setRestoringId(null);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    const getTotalItems = (counts: BackupMetadata["dataCounts"]): number => {
        return (
            counts.clients +
            counts.invoices +
            counts.documents +
            counts.statements +
            counts.preferences +
            counts.defaults
        );
    };

    const handleDownloadAllPdfs = async () => {
        setDownloadingPdfZip(true);
        setShowProgressDialog(true);
        setProgress(0);
        setProgressMessage("Preparing to generate PDFs...");

        // Start progress simulation
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev; // Don't go above 90% until download starts
                return prev + Math.random() * 10; // Increment by random amount
            });
        }, 500);

        try {
            // First, get the count of invoices to estimate time
            const countResponse = await fetch("/api/invoice/list");
            let totalInvoices = 0;
            if (countResponse.ok) {
                const countData = await countResponse.json();
                totalInvoices = countData.invoices?.length || 0;
                setProgressMessage(`Found ${totalInvoices} invoices. Generating PDFs...`);
            }

            // Update progress message during generation
            const messageInterval = setInterval(() => {
                setProgressMessage((prev) => {
                    if (prev.includes("Generating PDFs")) {
                        return "Generating PDFs... This may take a while.";
                    }
                    if (prev.includes("Creating ZIP")) {
                        return "Creating ZIP file...";
                    }
                    return "Processing invoices...";
                });
            }, 3000);

            const response = await fetch("/api/backup/pdf-zip");
            
            clearInterval(messageInterval);

            if (response.ok) {
                setProgress(95);
                setProgressMessage("Finalizing ZIP file...");
                
                const blob = await response.blob();
                
                setProgress(100);
                setProgressMessage("Download starting...");
                
                // Small delay to show 100% completion
                await new Promise((resolve) => setTimeout(resolve, 300));
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `invoices-${new Date().toISOString().slice(0, 10)}.zip`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                setShowProgressDialog(false);
                setProgress(0);
                toast({
                    title: "Success",
                    description: "All invoice PDFs downloaded as ZIP file",
                });
            } else {
                const error = await response.json();
                setShowProgressDialog(false);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.error || "Failed to download invoice PDFs",
                });
            }
        } catch (error) {
            console.error("Error downloading PDF zip:", error);
            setShowProgressDialog(false);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to download invoice PDFs",
            });
        } finally {
            clearInterval(progressInterval);
            setDownloadingPdfZip(false);
            setProgress(0);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-600 dark:text-gray-400">Loading backups...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Create Backup Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold">Your Backups</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Create, download, or restore your data backups
                    </p>
                </div>
                <div className="flex gap-2">
                    <BaseButton
                        onClick={handleDownloadAllPdfs}
                        disabled={downloadingPdfZip}
                        variant="outline"
                        tooltipLabel="Download all invoice PDFs as ZIP"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        {downloadingPdfZip ? "Generating..." : "Download All PDFs"}
                    </BaseButton>
                    <BaseButton
                        onClick={handleCreateBackup}
                        disabled={creating}
                        tooltipLabel="Create new backup"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {creating ? "Creating..." : "Create Backup"}
                    </BaseButton>
                </div>
            </div>

            {/* Backups List */}
            {backups.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <HardDrive className="w-16 h-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No backups found</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Create your first backup to protect your data
                        </p>
                        <BaseButton onClick={handleCreateBackup} disabled={creating}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Backup
                        </BaseButton>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {backups.map((backup) => (
                        <Card key={backup.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <FileArchive className="w-5 h-5" />
                                            Backup from {formatDate(backup.backupDate)}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(backup.backupDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Database className="w-4 h-4" />
                                                    {getTotalItems(backup.dataCounts)} items
                                                </span>
                                                <span>{formatFileSize(backup.fileSize)}</span>
                                            </div>
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <BaseButton
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload(backup.filename)}
                                            tooltipLabel="Download backup"
                                        >
                                            <Download className="w-4 h-4" />
                                        </BaseButton>
                                        <BaseButton
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setRestoringId(backup.filename);
                                                setShowRestoreDialog(true);
                                            }}
                                            tooltipLabel="Restore from backup"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </BaseButton>
                                        <BaseButton
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDeletingId(backup.filename)}
                                            tooltipLabel="Delete backup"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </BaseButton>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">
                                        {backup.dataCounts.clients} Clients
                                    </Badge>
                                    <Badge variant="secondary">
                                        {backup.dataCounts.invoices} Invoices
                                    </Badge>
                                    <Badge variant="secondary">
                                        {backup.dataCounts.documents} Documents
                                    </Badge>
                                    <Badge variant="secondary">
                                        {backup.dataCounts.statements} Statements
                                    </Badge>
                                    {backup.dataCounts.preferences > 0 && (
                                        <Badge variant="secondary">Preferences</Badge>
                                    )}
                                    <Badge variant="secondary">
                                        {backup.dataCounts.defaults} Defaults
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this backup? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingId && handleDelete(deletingId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Restore Dialog */}
            <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restore Backup</DialogTitle>
                        <DialogDescription>
                            Choose how you want to restore this backup:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Restore Mode</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={restoreMode}
                                onChange={(e) => setRestoreMode(e.target.value as "merge" | "replace")}
                            >
                                <option value="merge">
                                    Merge - Add new data, skip duplicates
                                </option>
                                <option value="replace">
                                    Replace - Delete all existing data and restore
                                </option>
                            </select>
                        </div>
                        {restoreMode === "replace" && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                                    ⚠️ Warning: Replace mode will delete all your existing data before restoring.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRestore} variant={restoreMode === "replace" ? "destructive" : "default"}>
                            Restore Backup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Progress Dialog */}
            <Dialog open={showProgressDialog} onOpenChange={(open) => {
                if (!downloadingPdfZip) {
                    setShowProgressDialog(open);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generating PDFs</DialogTitle>
                        <DialogDescription>
                            {progressMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Progress Bar */}
                        <div className="w-full">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Progress</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            Please wait while we generate all invoice PDFs. This may take several minutes depending on the number of invoices.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BackupList;

