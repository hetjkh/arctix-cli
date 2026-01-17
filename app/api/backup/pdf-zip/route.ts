import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { InvoiceDocument } from "@/models/Invoice";
import { InvoiceType } from "@/types";
import { ObjectId } from "mongodb";
import archiver from "archiver";
import { generatePdfService } from "@/services/invoice/server/generatePdfService";

/**
 * GET /api/backup/pdf-zip
 * Generate PDFs for all invoices and download them as a zip file
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

        // Create a zip archive
        const archive = archiver("zip", {
            zlib: { level: 9 }, // Maximum compression
        });

        // Collect chunks for the zip file
        const chunks: Buffer[] = [];
        
        archive.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });

        archive.on("error", (err) => {
            console.error("Archive error:", err);
        });

        // Generate PDFs for all invoices
        const pdfPromises = invoices.map(async (invoice) => {
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
        });

        // Wait for all PDFs to be generated
        const pdfResults = await Promise.all(pdfPromises);

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

