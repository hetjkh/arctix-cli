import { NextRequest, NextResponse } from "next/server";

// JSON2CSV
import { AsyncParser } from "@json2csv/node";

// XML2JS
import { Builder } from "xml2js";

// XLSX
import XLSX from "xlsx";
import ExcelJS from "exceljs";

// Helpers
import { flattenObject, formatNumberWithCommas, formatNumberWithCommasNoDecimals, isImageUrl, isDataUrl } from "@/lib/helpers";
import { DATE_OPTIONS } from "@/lib/variables";

// Types
import { ExportTypes } from "@/types";

/**
 * Export an invoice in selected format.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {NextResponse} A response object containing the exported data in the requested format.
 */
export async function exportInvoiceService(req: NextRequest) {
    const body = await req.json();
    const format = req.nextUrl.searchParams.get("format");

    try {
        switch (format) {
            case ExportTypes.JSON: {
                const jsonData = JSON.stringify(body);
                return new NextResponse(jsonData, {
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Disposition":
                            "attachment; filename=invoice.json",
                    },
                    status: 200,
                });
            }
            case ExportTypes.CSV: {
                //? Can pass specific fields to async parser. Empty = All
                const parser = new AsyncParser();
                const csv = await parser.parse(body).promise();
                return new NextResponse(csv, {
                    headers: {
                        "Content-Type": "text/csv",
                        "Content-Disposition":
                            "attachment; filename=invoice.csv",
                    },
                });
            }
            case ExportTypes.XML: {
                // Convert JSON to XML
                const builder = new Builder();
                const xml = builder.buildObject(body);
                return new NextResponse(xml, {
                    headers: {
                        "Content-Type": "application/xml",
                        "Content-Disposition":
                            "attachment; filename=invoice.xml",
                    },
                });
            }
            case ExportTypes.XLSX: {
                try {
                    const { sender, receiver, details } = body;
                    
                    // Use ExcelJS for better compatibility with Microsoft Excel
                    const workbook = new ExcelJS.Workbook();
                    const sheet = workbook.addWorksheet("Invoice");
                    
                    // Column visibility flags
                    const showPassengerName = details.showPassengerName !== false;
                    const showRoute = details.showRoute !== false;
                    const showAirlines = details.showAirlines !== false;
                    const showServiceType = details.showServiceType !== false;
                    const showAmount = details.showAmount !== false;
                    
                    // Column names
                    const defaultColumnNames = {
                        passengerName: "Passenger Name",
                        route: "Route",
                        airlines: "Airlines",
                        serviceType: "Type of Service",
                        amount: "Amount",
                    };
                    const columnNames = {
                        ...defaultColumnNames,
                        ...(details.columnNames || {}),
                    };
                    
                    let currentRow = 1;
                    
                    // ========== HEADER SECTION ==========
                    // Row 1: Logo and Sender Info (Left) | Title and Invoice Info (Right)
                    const headerRow = sheet.getRow(currentRow);
                    headerRow.height = 20;
                    
                    // Left side - Logo and Sender Name
                    if (details.invoiceLogo) {
                        try {
                            let imageBuffer: Buffer;
                            let imageExtension = 'png';
                            
                            if (isDataUrl(details.invoiceLogo)) {
                                // Handle base64 data URL
                                const match = details.invoiceLogo.match(/^data:image\/(\w+);base64,/);
                                if (match) {
                                    imageExtension = match[1] === 'jpeg' ? 'jpg' : match[1];
                                }
                                const base64Data = details.invoiceLogo.replace(/^data:image\/\w+;base64,/, '');
                                imageBuffer = Buffer.from(base64Data, 'base64');
                            } else if (isImageUrl(details.invoiceLogo)) {
                                // Handle image URL - fetch it
                                const response = await fetch(details.invoiceLogo);
                                if (response.ok) {
                                    const arrayBuffer = await response.arrayBuffer();
                                    imageBuffer = Buffer.from(arrayBuffer);
                                    
                                    // Try to detect extension from URL
                                    const urlLower = details.invoiceLogo.toLowerCase();
                                    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
                                        imageExtension = 'jpg';
                                    } else if (urlLower.includes('.png')) {
                                        imageExtension = 'png';
                                    } else if (urlLower.includes('.gif')) {
                                        imageExtension = 'gif';
                                    }
                                } else {
                                    throw new Error('Failed to fetch logo image');
                                }
                            } else {
                                throw new Error('Invalid logo format');
                            }
                            
                            // Add logo image to Excel
                            const logoImageId = workbook.addImage({
                                buffer: imageBuffer,
                                extension: imageExtension as 'png' | 'jpeg' | 'gif',
                            });
                            
                            // Position logo in cell A1 with size constraints
                            sheet.addImage(logoImageId, {
                                tl: { col: 0, row: currentRow - 1 },
                                ext: { width: 120, height: 68 }
                            });
                            
                            // Adjust row height to accommodate logo
                            sheet.getRow(currentRow).height = 68;
                        } catch (logoError) {
                            console.error("Error adding logo to Excel:", logoError);
                            // Fallback to text if image fails
                            sheet.getCell(`A${currentRow}`).value = "[LOGO]";
                        }
                    }
                    sheet.getCell(`A${currentRow + 1}`).value = sender.name || "";
                    sheet.getCell(`A${currentRow + 1}`).font = { size: 14, bold: true };
                    
                    // Sender details
                    sheet.getCell(`A${currentRow + 2}`).value = `${sender.city || ""}, ${sender.country || ""}`;
                    sheet.getCell(`A${currentRow + 3}`).value = sender.email || "";
                    sheet.getCell(`A${currentRow + 4}`).value = sender.phone || "";
                    
                    // Right side - Title and Invoice Info
                    sheet.getCell(`F${currentRow}`).value = "Travel Invoice";
                    sheet.getCell(`F${currentRow}`).font = { size: 16, bold: true };
                    sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
                    
                    sheet.getCell(`F${currentRow + 1}`).value = `Invoice #: ${details.invoiceNumber || ""}`;
                    sheet.getCell(`F${currentRow + 1}`).font = { bold: true };
                    sheet.getCell(`F${currentRow + 1}`).alignment = { horizontal: 'right' };
                    
                    const invoiceDate = details.invoiceDate 
                        ? new Date(details.invoiceDate).toLocaleDateString("en-US", DATE_OPTIONS)
                        : "-";
                    sheet.getCell(`F${currentRow + 2}`).value = `Issued: ${invoiceDate}`;
                    sheet.getCell(`F${currentRow + 2}`).font = { bold: true };
                    sheet.getCell(`F${currentRow + 2}`).alignment = { horizontal: 'right' };
                    
                    if (details.numberOfPassengers) {
                        sheet.getCell(`F${currentRow + 3}`).value = `Total Passengers: ${details.numberOfPassengers}`;
                        sheet.getCell(`F${currentRow + 3}`).font = { bold: true };
                        sheet.getCell(`F${currentRow + 3}`).alignment = { horizontal: 'right' };
                    }
                    
                    currentRow += 6;
                    
                    // ========== BILLED TO SECTION ==========
                    sheet.getCell(`F${currentRow}`).value = "BILLED TO";
                    sheet.getCell(`F${currentRow}`).font = { size: 10, bold: true };
                    sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
                    sheet.getCell(`F${currentRow}`).border = {
                        bottom: { style: 'thin', color: { argb: 'FF808080' } }
                    };
                    
                    currentRow++;
                    sheet.getCell(`F${currentRow}`).value = receiver.name || "";
                    sheet.getCell(`F${currentRow}`).font = { bold: true };
                    sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
                    
                    currentRow++;
                    sheet.getCell(`F${currentRow}`).value = `${receiver.city || ""}, ${receiver.country || ""}`;
                    sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
                    
                    currentRow++;
                    sheet.getCell(`F${currentRow}`).value = receiver.email || "";
                    sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
                    
                    currentRow++;
                    sheet.getCell(`F${currentRow}`).value = receiver.phone || "";
                    sheet.getCell(`F${currentRow}`).alignment = { horizontal: 'right' };
                    
                    currentRow += 2;
                    
                    // ========== ITEMS TABLE ==========
                    const tableStartRow = currentRow;
                    const headerRowObj = sheet.getRow(currentRow);
                    
                    // Table headers
                    let colIndex = 1;
                    if (showPassengerName) {
                        sheet.getCell(currentRow, colIndex).value = columnNames.passengerName;
                        colIndex++;
                    }
                    if (showRoute) {
                        sheet.getCell(currentRow, colIndex).value = columnNames.route;
                        colIndex++;
                    }
                    if (showAirlines) {
                        sheet.getCell(currentRow, colIndex).value = columnNames.airlines;
                        colIndex++;
                    }
                    if (showServiceType) {
                        sheet.getCell(currentRow, colIndex).value = columnNames.serviceType;
                        colIndex++;
                    }
                    if (showAmount) {
                        sheet.getCell(currentRow, colIndex).value = columnNames.amount;
                        colIndex++;
                    }
                    
                    // Style header row
                    headerRowObj.font = { size: 10, bold: true };
                    headerRowObj.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF5F5F5' }
                    };
                    headerRowObj.alignment = { horizontal: 'left', vertical: 'middle' };
                    headerRowObj.height = 20;
                    
                    // Add borders to header
                    for (let i = 1; i < colIndex; i++) {
                        const cell = sheet.getCell(currentRow, i);
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FF808080' } },
                            bottom: { style: 'thin', color: { argb: 'FF808080' } },
                            left: { style: 'thin', color: { argb: 'FF808080' } },
                            right: { style: 'thin', color: { argb: 'FF808080' } }
                        };
                    }
                    
                    // Set column widths
                    colIndex = 1;
                    if (showPassengerName) {
                        sheet.getColumn(colIndex).width = 18;
                        colIndex++;
                    }
                    if (showRoute) {
                        sheet.getColumn(colIndex).width = 32;
                        colIndex++;
                    }
                    if (showAirlines) {
                        sheet.getColumn(colIndex).width = 15;
                        colIndex++;
                    }
                    if (showServiceType) {
                        sheet.getColumn(colIndex).width = 15;
                        colIndex++;
                    }
                    if (showAmount) {
                        sheet.getColumn(colIndex).width = 20;
                        sheet.getColumn(colIndex).alignment = { horizontal: 'right' };
                        colIndex++;
                    }
                    
                    currentRow++;
                    
                    // Add items data
                    const items = details.items || [];
                    items.forEach((item: any, itemIndex: number) => {
                        const dataRow = sheet.getRow(currentRow);
                        let colIdx = 1;
                        
                        if (showPassengerName) {
                            sheet.getCell(currentRow, colIdx).value = item.passengerName || `Passenger ${itemIndex + 1}`;
                            sheet.getCell(currentRow, colIdx).font = { bold: true };
                            colIdx++;
                        }
                        if (showRoute) {
                            sheet.getCell(currentRow, colIdx).value = item.description || "";
                            colIdx++;
                        }
                        if (showAirlines) {
                            sheet.getCell(currentRow, colIdx).value = item.name || "";
                            colIdx++;
                        }
                        if (showServiceType) {
                            sheet.getCell(currentRow, colIdx).value = item.serviceType || "-";
                            colIdx++;
                        }
                        if (showAmount) {
                            const amount = formatNumberWithCommasNoDecimals(Number(item.unitPrice) || 0);
                            sheet.getCell(currentRow, colIdx).value = `${amount} ${details.currency}`;
                            sheet.getCell(currentRow, colIdx).alignment = { horizontal: 'right' };
                            colIdx++;
                        }
                        
                        // Add borders to data row
                        for (let i = 1; i < colIdx; i++) {
                            const cell = sheet.getCell(currentRow, i);
                            cell.border = {
                                top: { style: 'thin', color: { argb: 'FF808080' } },
                                bottom: { style: 'thin', color: { argb: 'FF808080' } },
                                left: { style: 'thin', color: { argb: 'FF808080' } },
                                right: { style: 'thin', color: { argb: 'FF808080' } }
                            };
                        }
                        
                        dataRow.height = 20;
                        currentRow++;
                        
                        // Add extra deliverables
                        if (item.extraDeliverables && Array.isArray(item.extraDeliverables)) {
                            item.extraDeliverables.forEach((extra: any) => {
                                const hasData = extra?.amount !== undefined || extra?.name || extra?.rowName || extra?.serviceType;
                                if (!hasData) return;
                                
                                const extraRow = sheet.getRow(currentRow);
                                let extraColIdx = 1;
                                
                                if (showPassengerName) {
                                    sheet.getCell(currentRow, extraColIdx).value = extra.rowName || "";
                                    sheet.getCell(currentRow, extraColIdx).font = { bold: true };
                                    extraColIdx++;
                                }
                                if (showRoute) {
                                    sheet.getCell(currentRow, extraColIdx).value = extra.name || "";
                                    extraColIdx++;
                                }
                                if (showAirlines) {
                                    sheet.getCell(currentRow, extraColIdx).value = "";
                                    extraColIdx++;
                                }
                                if (showServiceType) {
                                    sheet.getCell(currentRow, extraColIdx).value = extra.serviceType || "-";
                                    extraColIdx++;
                                }
                                if (showAmount) {
                                    if (extra.amount !== undefined && extra.amount !== null && extra.amount !== "") {
                                        const extraAmount = formatNumberWithCommasNoDecimals(Number(extra.amount) || 0);
                                        sheet.getCell(currentRow, extraColIdx).value = `${extraAmount} ${details.currency}`;
                                    }
                                    sheet.getCell(currentRow, extraColIdx).alignment = { horizontal: 'right' };
                                    extraColIdx++;
                                }
                                
                                // Add borders
                                for (let i = 1; i < extraColIdx; i++) {
                                    const cell = sheet.getCell(currentRow, i);
                                    cell.border = {
                                        top: { style: 'thin', color: { argb: 'FF808080' } },
                                        bottom: { style: 'thin', color: { argb: 'FF808080' } },
                                        left: { style: 'thin', color: { argb: 'FF808080' } },
                                        right: { style: 'thin', color: { argb: 'FF808080' } }
                                    };
                                }
                                
                                extraRow.height = 20;
                                currentRow++;
                            });
                        }
                        
                        // Add VAT row if applicable
                        const mainVat = item.vat !== undefined && Number(item.vat) > 0 ? Number(item.vat) : 0;
                        let totalExtraVat = 0;
                        if (item.extraDeliverables && Array.isArray(item.extraDeliverables)) {
                            item.extraDeliverables.forEach((extra: any) => {
                                if (extra?.showVat && extra?.vat !== undefined && Number(extra.vat) > 0) {
                                    totalExtraVat += Number(extra.vat) || 0;
                                }
                            });
                        }
                        const mergedVatTotal = mainVat + totalExtraVat;
                        
                        if (mergedVatTotal > 0) {
                            const vatRow = sheet.getRow(currentRow);
                            const visibleCols = [showPassengerName, showRoute, showAirlines, showServiceType, showAmount].filter(Boolean).length;
                            
                            // Merge cells for VAT label
                            if (visibleCols > 1) {
                                sheet.mergeCells(currentRow, 1, currentRow, visibleCols - 1);
                            }
                            sheet.getCell(currentRow, 1).value = "VAT";
                            sheet.getCell(currentRow, 1).font = { bold: true };
                            
                            if (showAmount) {
                                const vatAmount = formatNumberWithCommas(mergedVatTotal);
                                sheet.getCell(currentRow, visibleCols).value = `${vatAmount} ${details.currency}`;
                                sheet.getCell(currentRow, visibleCols).alignment = { horizontal: 'right' };
                                sheet.getCell(currentRow, visibleCols).font = { bold: true };
                            }
                            
                            // Add borders
                            for (let i = 1; i <= visibleCols; i++) {
                                const cell = sheet.getCell(currentRow, i);
                                cell.border = {
                                    top: { style: 'thin', color: { argb: 'FF808080' } },
                                    bottom: { style: 'thin', color: { argb: 'FF808080' } },
                                    left: { style: 'thin', color: { argb: 'FF808080' } },
                                    right: { style: 'thin', color: { argb: 'FF808080' } }
                                };
                            }
                            
                            vatRow.height = 20;
                            currentRow++;
                        }
                    });
                    
                    currentRow += 2;
                    
                    // ========== TOTALS SECTION ==========
                    const totalsStartRow = currentRow;
                    
                    // Left side - Notes and Payment Terms
                    if (details.additionalNotes) {
                        sheet.getCell(currentRow, 1).value = "NOTES";
                        sheet.getCell(currentRow, 1).font = { size: 10, bold: true };
                        currentRow++;
                        sheet.getCell(currentRow, 1).value = details.additionalNotes;
                        currentRow += 2;
                    }
                    
                    if (details.paymentTerms) {
                        sheet.getCell(currentRow, 1).value = "PAYMENT TERMS";
                        sheet.getCell(currentRow, 1).font = { size: 10, bold: true };
                        currentRow++;
                        sheet.getCell(currentRow, 1).value = details.paymentTerms;
                        currentRow += 2;
                    }
                    
                    // Right side - Totals box
                    const totalsCol = showPassengerName && showRoute && showAirlines && showServiceType ? 5 : 4;
                    let totalsRow = totalsStartRow;
                    
                    // Create totals box with border
                    const totalsEndRow = totalsRow + 10;
                    for (let r = totalsRow; r <= totalsEndRow; r++) {
                        for (let c = totalsCol; c <= totalsCol + 1; c++) {
                            const cell = sheet.getCell(r, c);
                            cell.border = {
                                top: { style: 'thin', color: { argb: 'FF808080' } },
                                bottom: { style: 'thin', color: { argb: 'FF808080' } },
                                left: { style: 'thin', color: { argb: 'FF808080' } },
                                right: { style: 'thin', color: { argb: 'FF808080' } }
                            };
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF9F9F9' }
                            };
                        }
                    }
                    
                    sheet.getCell(totalsRow, totalsCol).value = "Subtotal";
                    sheet.getCell(totalsRow, totalsCol).font = { bold: true };
                    sheet.getCell(totalsRow, totalsCol + 1).value = `${formatNumberWithCommas(Number(details.subTotal) || 0)} ${details.currency}`;
                    sheet.getCell(totalsRow, totalsCol + 1).alignment = { horizontal: 'right' };
                    totalsRow++;
                    
                    if (details.discountDetails?.amount) {
                        sheet.getCell(totalsRow, totalsCol).value = "Discount";
                        sheet.getCell(totalsRow, totalsCol).font = { bold: true };
                        const discountValue = details.discountDetails.amountType === "amount"
                            ? `- ${formatNumberWithCommas(Number(details.discountDetails.amount) || 0)} ${details.currency}`
                            : `- ${details.discountDetails.amount}%`;
                        sheet.getCell(totalsRow, totalsCol + 1).value = discountValue;
                        sheet.getCell(totalsRow, totalsCol + 1).alignment = { horizontal: 'right' };
                        totalsRow++;
                    }
                    
                    if (details.taxDetails?.amount) {
                        sheet.getCell(totalsRow, totalsCol).value = "Tax";
                        sheet.getCell(totalsRow, totalsCol).font = { bold: true };
                        const taxValue = details.taxDetails.amountType === "amount"
                            ? `+ ${formatNumberWithCommas(Number(details.taxDetails.amount) || 0)} ${details.currency}`
                            : `+ ${details.taxDetails.amount}%`;
                        sheet.getCell(totalsRow, totalsCol + 1).value = taxValue;
                        sheet.getCell(totalsRow, totalsCol + 1).alignment = { horizontal: 'right' };
                        totalsRow++;
                    }
                    
                    if (details.shippingDetails?.cost) {
                        sheet.getCell(totalsRow, totalsCol).value = "Service Fees";
                        sheet.getCell(totalsRow, totalsCol).font = { bold: true };
                        const shippingValue = details.shippingDetails.costType === "amount"
                            ? `+ ${formatNumberWithCommas(Number(details.shippingDetails.cost) || 0)} ${details.currency}`
                            : `+ ${details.shippingDetails.cost}%`;
                        sheet.getCell(totalsRow, totalsCol + 1).value = shippingValue;
                        sheet.getCell(totalsRow, totalsCol + 1).alignment = { horizontal: 'right' };
                        totalsRow++;
                    }
                    
                    totalsRow++;
                    // Total row with top border
                    sheet.getCell(totalsRow, totalsCol).value = "Total";
                    sheet.getCell(totalsRow, totalsCol).font = { size: 12, bold: true };
                    sheet.getCell(totalsRow, totalsCol).border = {
                        top: { style: 'thin', color: { argb: 'FF808080' } }
                    };
                    sheet.getCell(totalsRow, totalsCol + 1).value = `${formatNumberWithCommas(Number(details.totalAmount) || 0)} ${details.currency}`;
                    sheet.getCell(totalsRow, totalsCol + 1).font = { size: 12, bold: true };
                    sheet.getCell(totalsRow, totalsCol + 1).alignment = { horizontal: 'right' };
                    sheet.getCell(totalsRow, totalsCol + 1).border = {
                        top: { style: 'thin', color: { argb: 'FF808080' } }
                    };
                    totalsRow++;
                    
                    if (details.totalAmountInWords) {
                        sheet.getCell(totalsRow, totalsCol).value = `Amount in words: ${details.totalAmountInWords} ${details.currency}`;
                        sheet.getCell(totalsRow, totalsCol).font = { size: 9, italic: true };
                        sheet.mergeCells(totalsRow, totalsCol, totalsRow, totalsCol + 1);
                        totalsRow++;
                    }
                    
                    currentRow = Math.max(currentRow, totalsRow) + 2;
                    
                    // ========== PAYMENT INFORMATION AND SIGNATURE ==========
                    if (details.paymentInformation) {
                        sheet.getCell(currentRow, 1).value = "PAYMENT INSTRUCTIONS";
                        sheet.getCell(currentRow, 1).font = { size: 10, bold: true };
                        currentRow++;
                        sheet.getCell(currentRow, 1).value = `Bank: ${details.paymentInformation.bankName || ""}`;
                        currentRow++;
                        sheet.getCell(currentRow, 1).value = `Account Name: ${details.paymentInformation.accountName || ""}`;
                        currentRow++;
                        sheet.getCell(currentRow, 1).value = `Account Number: ${details.paymentInformation.accountNumber || ""}`;
                        currentRow++;
                        if (details.paymentInformation.iban) {
                            sheet.getCell(currentRow, 1).value = `IBAN No: ${details.paymentInformation.iban}`;
                            currentRow++;
                        }
                        if (details.paymentInformation.swiftCode) {
                            sheet.getCell(currentRow, 1).value = `SWIFT Code: ${details.paymentInformation.swiftCode}`;
                            currentRow++;
                        }
                        currentRow++;
                    }
                    
                    if (details.signature?.data) {
                        sheet.getCell(currentRow, totalsCol).value = "Authorized Signature";
                        sheet.getCell(currentRow, totalsCol).font = { size: 10, bold: true };
                        currentRow++;
                        
                        // Check if signature is an image
                        if (isImageUrl(details.signature.data)) {
                            try {
                                let signatureBuffer: Buffer;
                                let signatureExtension = 'png';
                                
                                if (isDataUrl(details.signature.data)) {
                                    // Handle base64 data URL
                                    const match = details.signature.data.match(/^data:image\/(\w+);base64,/);
                                    if (match) {
                                        signatureExtension = match[1] === 'jpeg' ? 'jpg' : match[1];
                                    }
                                    const base64Data = details.signature.data.replace(/^data:image\/\w+;base64,/, '');
                                    signatureBuffer = Buffer.from(base64Data, 'base64');
                                } else {
                                    // Handle image URL - fetch it
                                    const response = await fetch(details.signature.data);
                                    if (response.ok) {
                                        const arrayBuffer = await response.arrayBuffer();
                                        signatureBuffer = Buffer.from(arrayBuffer);
                                        
                                        // Try to detect extension from URL
                                        const urlLower = details.signature.data.toLowerCase();
                                        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
                                            signatureExtension = 'jpg';
                                        } else if (urlLower.includes('.png')) {
                                            signatureExtension = 'png';
                                        } else if (urlLower.includes('.gif')) {
                                            signatureExtension = 'gif';
                                        }
                                    } else {
                                        throw new Error('Failed to fetch signature image');
                                    }
                                }
                                
                                // Add signature image to Excel
                                const signatureImageId = workbook.addImage({
                                    buffer: signatureBuffer,
                                    extension: signatureExtension as 'png' | 'jpeg' | 'gif',
                                });
                                
                                // Position signature in the cell
                                sheet.addImage(signatureImageId, {
                                    tl: { col: totalsCol - 1, row: currentRow - 1 },
                                    ext: { width: 120, height: 60 }
                                });
                                
                                // Adjust row height to accommodate signature
                                sheet.getRow(currentRow).height = 60;
                                
                                // Move to next row after image
                                currentRow += 3; // Adjust based on image height
                            } catch (signatureError) {
                                console.error("Error adding signature image to Excel:", signatureError);
                                // Fallback to text if image fails
                                sheet.getCell(currentRow, totalsCol).value = details.signature.data;
                                sheet.getCell(currentRow, totalsCol).font = { size: 12 };
                                currentRow++;
                            }
                        } else {
                            // Text signature
                            sheet.getCell(currentRow, totalsCol).value = details.signature.data;
                            sheet.getCell(currentRow, totalsCol).font = { 
                                size: 12,
                                name: details.signature.fontFamily || 'cursive'
                            };
                            currentRow++;
                        }
                        
                        sheet.getCell(currentRow, totalsCol).value = sender.name || "";
                    }
                    
                    // Create a sheet with full JSON data for complete import
                    const fullJsonData = JSON.stringify(body);
                    const base64Json = Buffer.from(fullJsonData, 'utf8').toString('base64');
                    
                    const jsonSheet = workbook.addWorksheet("_JSON_DATA");
                    jsonSheet.addRow(["INVOIFY_JSON_DATA_BASE64"]);
                    
                    const MAX_CELL_LENGTH = 32000;
                    if (base64Json.length <= MAX_CELL_LENGTH) {
                        jsonSheet.addRow([base64Json]);
                    } else {
                        let remaining = base64Json;
                        while (remaining.length > 0) {
                            const chunk = remaining.substring(0, MAX_CELL_LENGTH);
                            jsonSheet.addRow([chunk]);
                            remaining = remaining.substring(MAX_CELL_LENGTH);
                        }
                    }
                    
                    // Generate Excel file as buffer
                    const buffer = await workbook.xlsx.writeBuffer();

                    // Convert to Uint8Array and wrap in Blob
                    const uint8Array = new Uint8Array(buffer);
                    const blob = new Blob([uint8Array], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });

                    return new NextResponse(blob, {
                        headers: {
                            "Content-Type":
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "Content-Disposition":
                                "attachment; filename=invoice.xlsx",
                        },
                    });
                } catch (xlsxError) {
                    console.error("XLSX export error:", xlsxError);
                    throw xlsxError;
                }
            }
        }
    } catch (error) {
        console.error(error);

        // Return an error response
        return new Response(`Error exporting: \n${error}`, {
            status: 500,
        });
    }
}
