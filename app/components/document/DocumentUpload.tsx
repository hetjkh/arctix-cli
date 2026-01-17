"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X, File } from "lucide-react";

interface DocumentUploadProps {
    invoiceId?: string;
    onUploadSuccess?: (document: any) => void;
    onCancel?: () => void;
}

const DocumentUpload = ({ invoiceId, onUploadSuccess, onCancel }: DocumentUploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!name) {
                setName(selectedFile.name);
            }
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
            formData.append("name", name || file.name);
            if (description) formData.append("description", description);
            if (category) formData.append("category", category);
            if (tags) formData.append("tags", tags);
            if (invoiceId) formData.append("invoiceId", invoiceId);

            const response = await fetch("/api/document/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                if (onUploadSuccess) {
                    onUploadSuccess(data.document);
                }
                // Reset form
                setFile(null);
                setName("");
                setDescription("");
                setCategory("");
                setTags("");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            } else {
                const error = await response.json();
                alert(error.error || "Failed to upload document");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading document");
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
                <Label>File *</Label>
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
                <Label>Name *</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Document name"
                />
            </div>

            <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Document description..."
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
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
                    {uploading ? "Uploading..." : "Upload"}
                </Button>
            </div>
        </div>
    );
};

export default DocumentUpload;

