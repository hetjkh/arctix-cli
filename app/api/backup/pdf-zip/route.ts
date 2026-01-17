// Configure execution timeout (Vercel Pro: 60s, Enterprise: 300s)
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes maximum

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { InvoiceDocument } from "@/models/Invoice";
import { InvoiceType } from "@/types";
import { ObjectId } from "mongodb";
import archiver from "archiver";
import { generatePdfService } from "@/services/invoice/server/generatePdfService";

/**
 * Process invoices in batches to avoid memory issues
 */
async function processBatch<T>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<any>
): Promise<any[]> {
    const results: any[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
    }
    return results;
}

/**
 * GET /api/backup/pdf-zip
 * Generate PDFs for all invoices and download them as a zip file
 * Optimized with batching for large invoice counts (100+)
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get all invoices for the user
        const db = await getDb();
        const invoicesCollection = db.collection<InvoiceDocument>("invoices");
        const invoices = await invoicesCollection
            .find({ userId: new ObjectId(user.userId) })
            .sort({ createdAt: -1 })
            .toArray();

        if (invoices.length === 0) {
            return NextResponse.json(
                { error: "No invoices found" },
                { status: 404 }
            );
        }

        const totalInvoices = invoices.length;
        console.log(`Starting PDF generation for ${totalInvoices} invoices`);

        // Estimate time: ~3 seconds per PDF (Puppeteer browser launch + PDF generation)
        // With batching of 10, we process ~10 PDFs in parallel, taking ~5-8 seconds per batch
        const batchSize = 10; // Process 10 PDFs at a time to balance speed and memory
        const estimatedSeconds = Math.ceil((totalInvoices / batchSize) * 6);
        const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
        
        console.log(`Estimated time: ~${estimatedMinutes} minute(s) for ${totalInvoices} invoices`);

        // Warn if processing too many (may timeout)
        if (totalInvoices > 200) {
            return NextResponse.json(
                { 
                    error: `Too many invoices (${totalInvoices}). Maximum 200 invoices supported per batch. Please contact support for bulk exports.`,
                    invoiceCount: totalInvoices
                },
                { status: 400 }
            );
        }

        // Create a zip archive
        const archive = archiver("zip", {
            zlib: { level: 5 }, // Balanced compression (level 9 is too slow for large files)
        });

        // Collect chunks for the zip file
        const chunks: Buffer[] = [];
        
        archive.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });

        archive.on("error", (err) => {
            console.error("Archive error:", err);
        });

        // Process PDF generation in batches to avoid memory issues
        const pdfProcessor = async (invoice: InvoiceDocument) => {
            try {
                // Remove MongoDB-specific fields
                const { _id, userId, createdAt, updatedAt, ...invoiceData } = invoice;
                
                // Create a request for PDF generation
                const pdfRequest = new NextRequest(new URL("http://localhost/api/invoice/generate"), {
                    method: "POST",
                    body: JSON.stringify(invoiceData as InvoiceType),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                // Generate PDF
                const pdfResponse = await generatePdfService(pdfRequest);
                
                if (pdfResponse.ok) {
                    const pdfBlob = await pdfResponse.blob();
                    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
                    
                    // Generate safe filename from invoice number
                    const invoiceNumber = invoice.details?.invoiceNumber || `invoice-${_id?.toString().slice(-8)}`;
                    const safeFilename = invoiceNumber
                        .replace(/[^a-z0-9]/gi, "_")
                        .toLowerCase();
                    const filename = `${safeFilename}.pdf`;
                    
                    return { filename, buffer: pdfBuffer };
                }
                return null;
            } catch (error) {
                console.error(`Error processing invoice ${invoice._id}:`, error);
                return null;
            }
        };

        // Process invoices in batches
        console.log(`Processing ${totalInvoices} invoices in batches of ${batchSize}...`);
        const pdfResults = await processBatch(invoices, batchSize, pdfProcessor);

        // Add all PDFs to the archive
        let addedCount = 0;
        for (const result of pdfResults) {
            if (result) {
                archive.append(result.buffer, { name: result.filename });
                addedCount++;
            }
        }

        // Finalize the archive and wait for it to finish
        await new Promise<void>((resolve, reject) => {
            archive.on("end", () => {
                resolve();
            });
            archive.on("error", (err) => {
                reject(err);
            });
            archive.finalize();
        });

        // Combine all chunks into a single buffer
        const zipBuffer = Buffer.concat(chunks as any);
        const zipUint8Array = new Uint8Array(zipBuffer);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
        const zipFilename = `invoices-${timestamp}.zip`;

        return new NextResponse(zipUint8Array, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${zipFilename}"`,
                "Content-Length": zipBuffer.length.toString(),
            },
            status: 200,
        });
    } catch (error: any) {
        console.error("PDF ZIP export error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate PDF zip file" },
            { status: 500 }
        );
    }
}

