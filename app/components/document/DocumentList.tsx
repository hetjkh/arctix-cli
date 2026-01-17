"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, Trash2, History, File, Search, X } from "lucide-react";
import DocumentUpload from "./DocumentUpload";

interface Document {
    id: string;
    name: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    description?: string;
    category?: string;
    tags?: string[];
    version: number;
    createdAt: string;
}

interface DocumentListProps {
    invoiceId?: string;
    onDocumentSelect?: (document: Document) => void;
    showUpload?: boolean;
}

const DocumentList = ({ invoiceId, onDocumentSelect, showUpload = true }: DocumentListProps) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [showUploadForm, setShowUploadForm] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [invoiceId, categoryFilter, searchQuery]);

    const fetchDocuments = async () => {
        try {
            let url = "/api/document/list?";
            if (invoiceId) url += `invoiceId=${invoiceId}&`;
            if (categoryFilter !== "all") url += `category=${categoryFilter}&`;
            if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) {
            return;
        }

        try {
            const response = await fetch(`/api/document/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setDocuments(documents.filter((d) => d.id !== id));
            } else {
                alert("Failed to delete document");
            }
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Error deleting document");
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Loading documents...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search documents by name, description, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                {showUpload && (
                    <Button onClick={() => setShowUploadForm(!showUploadForm)}>
                        <File className="w-4 h-4 mr-2" />
                        Upload Document
                    </Button>
                )}
            </div>

            {showUploadForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Upload New Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DocumentUpload
                            invoiceId={invoiceId}
                            onUploadSuccess={() => {
                                setShowUploadForm(false);
                                fetchDocuments();
                            }}
                            onCancel={() => setShowUploadForm(false)}
                        />
                    </CardContent>
                </Card>
            )}

            {documents.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500">
                            {searchQuery
                                ? "No documents found matching your search."
                                : "No documents yet. Upload your first document to get started."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Documents ({documents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <File className="w-4 h-4" />
                                                <span>{doc.name}</span>
                                                {doc.version > 1 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        v{doc.version}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {doc.category && (
                                                <Badge variant="outline">{doc.category}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                                        <TableCell>
                                            {doc.tags && doc.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {doc.tags.slice(0, 2).map((tag, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {doc.tags.length > 2 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{doc.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(doc.fileUrl, "_blank")}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Navigate to version history
                                                        window.location.href = `/documents/${doc.id}`;
                                                    }}
                                                >
                                                    <History className="w-4 h-4" />
                                                </Button>
                                                {onDocumentSelect && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onDocumentSelect(doc)}
                                                    >
                                                        Select
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(doc.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DocumentList;

