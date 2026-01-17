"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, File } from "lucide-react";

interface DocumentVersionUploadProps {
    documentId: string;
    onUploadSuccess?: () => void;
    onCancel?: () => void;
}

const DocumentVersionUpload = ({
    documentId,
    onUploadSuccess,
    onCancel,
}: DocumentVersionUploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            if (description) formData.append("description", description);

            const response = await fetch(`/api/document/${documentId}/version`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
                // Reset form
                setFile(null);
                setDescription("");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            } else {
                const error = await response.json();
                alert(error.error || "Failed to upload new version");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading new version");
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
                <Label>New Version File *</Label>
                <div className="flex items-center gap-2">
                    <Input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="flex-1"
                    />
                    {file && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFile(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                }
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                {file && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <File className="w-4 h-4" />
                        <span>{file.name}</span>
                        <span className="text-xs">({formatFileSize(file.size)})</span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Version Description (Optional)</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What changed in this version..."
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload New Version"}
                </Button>
            </div>
        </div>
    );
};

export default DocumentVersionUpload;

