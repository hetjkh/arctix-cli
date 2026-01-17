import React from "react";
import { InvoiceType } from "@/types";
import { formatNumberWithCommas, isImageUrl, isDataUrl } from "@/lib/helpers";
import { DATE_OPTIONS } from "@/lib/variables";

type StatementData = {
    invoices: InvoiceType[];
    title?: string;
    billedToName?: string;
};

const StatementTemplate = (data: StatementData) => {
    const { invoices, title = "STATEMENT", billedToName } = data;

    // Flatten invoices into passenger rows (one row per item/passenger)
    type PassengerRow = {
        invoice: InvoiceType;
        item: InvoiceType["details"]["items"][0];
        itemIndex: number;
    };

    const passengerRows: PassengerRow[] = [];
    
    // Sort invoices by date first
    const sortedInvoices = [...invoices].sort((a, b) => {
        const dateA = new Date(a.details.invoiceDate).getTime();
        const dateB = new Date(b.details.invoiceDate).getTime();
        return dateA - dateB;
    });

    // Create a row for each passenger (item) in each invoice
    sortedInvoices.forEach((invoice) => {
        invoice.details.items.forEach((item, itemIndex) => {
            passengerRows.push({ invoice, item, itemIndex });
        });
    });

    // Calculate total amount from all items
    const totalAmount = passengerRows.reduce((sum, row) => {
        return sum + (Number(row.item.total) || 0);
    }, 0);

    // Get currency from first invoice (assuming all invoices use same currency)
    const currency = invoices[0]?.details.currency || "USD";

    // Get sender and details from first invoice (assuming all invoices have same sender)
    const firstInvoice = invoices[0];
    const sender = firstInvoice?.sender || { name: "", city: "", country: "", email: "", phone: "" };
    const details = firstInvoice?.details || {};
    const receiver = firstInvoice?.receiver || { name: "", city: "", country: "", email: "", phone: "" };

    // Get signature font if available
    const fontHref = details.signature?.fontFamily
        ? `https://fonts.googleapis.com/css2?family=${details.signature.fontFamily}&display=swap`
        : "";

    return (
        <>
            {/* Load signature font if needed */}
            {details.signature?.fontFamily && (
                <>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link
                        rel="preconnect"
                        href="https://fonts.gstatic.com"
                        crossOrigin="anonymous"
                    />
                    <link href={fontHref} rel="stylesheet" />
                </>
            )}
            <div className="min-h-screen bg-white p-8" style={{ fontFamily: "Outfit, sans-serif" }}>
                <div className="max-w-5xl mx-auto">
                {/* Header with Logo and Company Details */}
                <div className="flex flex-wrap justify-between items-start gap-6 mb-8 border-b border-gray-300 pb-6">
                    <div className="flex-1 min-w-[300px] space-y-3">
                        {details.invoiceLogo && (
                            <img
                                src={details.invoiceLogo}
                                width={140}
                                height={100}
                                alt={`Logo of ${sender.name}`}
                                className="mb-3"
                            />
                        )}
                        <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-800">
                            {sender.name || "Company Name"}
                        </h1>
                        <div className="text-sm text-gray-700 space-y-1">
                            {(sender.city || sender.country) && (
                                <p className="font-medium">
                                    {[sender.city, sender.country].filter(Boolean).join(", ")}
                                </p>
                            )}
                            {sender.email && (
                                <p>
                                    <span className="font-semibold">Email:</span> {sender.email}
                                </p>
                            )}
                            {sender.phone && (
                                <>
                                    {(Array.isArray(sender.phone) ? sender.phone : [sender.phone]).filter(phone => phone && phone.trim()).map((phone, index) => (
                                        <p key={index}>
                                            <span className="font-semibold">Phone{index > 0 ? ` ${index + 1}` : ''}:</span> {phone.trim()}
                                        </p>
                                    ))}
                                </>
                            )}
                            {sender.customInputs && sender.customInputs.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {sender.customInputs.map((input, idx) => (
                                        <p key={idx}>
                                            <span className="font-semibold">{input.key}:</span> {input.value}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-right space-y-3">
                        <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">
                            {title}
                        </h2>
                        <div className="text-sm text-gray-700 space-y-1">
                            <p>
                                <span className="font-semibold">Generated:</span>{" "}
                                {new Date().toLocaleDateString("en-US", DATE_OPTIONS)}
                            </p>
                            <p>
                                <span className="font-semibold">Total Invoices:</span> {invoices.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Billed To Section */}
                <div className="mb-6 mt-4">
                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1 inline-block">
                            Billed To
                        </p>
                        <div className="mt-2 min-h-[80px] border border-gray-300 rounded p-3 bg-gray-50">
                            {billedToName ? (
                                <p className="text-base font-medium text-gray-900">{billedToName}</p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No name provided</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border-r border-gray-300">
                                    DATE
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border-r border-gray-300">
                                    INVOICE NO
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border-r border-gray-300">
                                    NAME
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase border-r border-gray-300">
                                    ROUTE
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 uppercase">
                                    AMOUNT
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {passengerRows.map((row, index) => {
                                const invoice = row.invoice;
                                const item = row.item;
                                
                                const invoiceDate = new Date(invoice.details.invoiceDate);
                                const day = invoiceDate.getDate();
                                const month = invoiceDate.toLocaleDateString("en-US", { month: "short" });
                                const year = invoiceDate.getFullYear().toString().slice(-2);
                                const formattedDate = `${day}-${month}-${year}`;

                                // Get route from this specific item's description, service type, or name
                                const route = item.description || item.serviceType || item.name || "-";

                                // Get passenger name from this specific item
                                const passengerName = item.passengerName || "-";

                                return (
                                    <tr
                                        key={`${invoice.details.invoiceNumber}-${row.itemIndex}`}
                                        className="border-b border-gray-200 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-300">
                                            {formattedDate}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-300">
                                            {invoice.details.invoiceNumber || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-300">
                                            {passengerName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-300">
                                            {route}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">
                                            {formatNumberWithCommas(Number(item.total) || 0)}
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Total Row */}
                            <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300"></td>
                                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300"></td>
                                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300"></td>
                                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                                    TOTAL
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                    {formatNumberWithCommas(totalAmount)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer with Signature */}
                <div className="mt-8 border-t border-gray-300 pt-6">
                    <div className="flex justify-between items-end">
                        {/* Billing Signature */}
                        <div className="text-left space-y-6">
                            {/* Receiver Name */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
                                    Receiver Name - 
                                </p>
                                <div className="min-w-[200px] min-h-[30px] border-b border-gray-300">
                                    {/* Empty receiver name field - can be filled manually */}
                                </div>
                            </div>

                            {/* Signature */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
                                    Signature - 
                                </p>
                                <div className="min-w-[200px] min-h-[60px] border-b border-gray-300">
                                    {/* Empty signature field - can be filled manually */}
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
                                    Date - 
                                </p>
                                <div className="min-w-[200px] min-h-[30px] border-b border-gray-300">
                                    {/* Empty date field - can be filled manually */}
                                </div>
                            </div>

                            {/* Receiver Stamp */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
                                    Receiver Stamp
                                </p>
                                <div className="min-w-[200px] min-h-[60px] border border-gray-300 rounded">
                                    {/* Empty receiver stamp field - can be filled manually */}
                                </div>
                            </div>
                        </div>

                        {/* Authorized Signature */}
                        {details.signature?.data && (
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
                                    Authorized Signature 
                                </p>
                                {isImageUrl(details.signature.data) ? (
                                    <img
                                        src={details.signature.data}
                                        width={140}
                                        height={70}
                                        alt={`Signature of ${sender.name}`}
                                        className="border border-gray-300 rounded"
                                    />
                                ) : (
                                    <div className="border border-gray-300 rounded p-2 bg-white min-w-[140px]">
                                        <p
                                            style={{
                                                fontSize: 28,
                                                fontWeight: 400,
                                                fontFamily: `${details.signature.fontFamily || "Dancing Script"}, cursive`,
                                                margin: 0,
                                                textAlign: "center",
                                            }}
                                        >
                                            {details.signature.data}
                                        </p>
                                    </div>
                                )}
                                <p className="text-sm text-gray-600 mt-2 font-medium">{sender.name}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default StatementTemplate;

