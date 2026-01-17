"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, Upload, File } from "lucide-react";
import DocumentVersionUpload from "./DocumentVersionUpload";

interface DocumentVersion {
    id: string;
    name: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    version: number;
    isCurrentVersion: boolean;
    createdAt: string;
    uploadedBy: string;
}

interface DocumentVersionHistoryProps {
    documentId: string;
}

const DocumentVersionHistory = ({ documentId }: DocumentVersionHistoryProps) => {
    const [document, setDocument] = useState<any>(null);
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);

    useEffect(() => {
        fetchDocument();
    }, [documentId]);

    const fetchDocument = async () => {
        try {
            const response = await fetch(`/api/document/${documentId}`);
            if (response.ok) {
                const data = await response.json();
                setDocument(data.document);
                setVersions(data.versions || []);
            } else {
                alert("Failed to load document");
            }
        } catch (error) {
            console.error("Error fetching document:", error);
            alert("Error loading document");
        } finally {
            setLoading(false);
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
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Loading document history...</p>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="flex justify-center items-center p-8">
                <p>Document not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{document.name}</CardTitle>
                        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New Version
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-medium">File:</span> {document.fileName}
                        </div>
                        <div>
                            <span className="font-medium">Size:</span> {formatFileSize(document.fileSize)}
                        </div>
                        {document.description && (
                            <div>
                                <span className="font-medium">Description:</span> {document.description}
                            </div>
                        )}
                        {document.category && (
                            <div>
                                <span className="font-medium">Category:</span>{" "}
                                <Badge variant="outline">{document.category}</Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {showUploadForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Upload New Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DocumentVersionUpload
                            documentId={documentId}
                            onUploadSuccess={() => {
                                setShowUploadForm(false);
                                fetchDocument();
                            }}
                            onCancel={() => setShowUploadForm(false)}
                        />
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Version History ({versions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Version</TableHead>
                                <TableHead>File Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {versions.map((version) => (
                                <TableRow key={version.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">v{version.version}</span>
                                            {version.isCurrentVersion && (
                                                <Badge variant="default" className="text-xs">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <File className="w-4 h-4" />
                                            {version.fileName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatFileSize(version.fileSize)}</TableCell>
                                    <TableCell>{formatDate(version.createdAt)}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(version.fileUrl, "_blank")}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default DocumentVersionHistory;

