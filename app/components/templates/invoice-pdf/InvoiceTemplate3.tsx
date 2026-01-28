import React from "react";
import { InvoiceType } from "@/types";
import InvoiceLayout from "./InvoiceLayout";
import { formatNumberWithCommas, isImageUrl } from "@/lib/helpers";
import PaymentInstructionsSection from "./PaymentInstructionsSection";
import { DATE_OPTIONS } from "@/lib/variables";

const InvoiceTemplate3 = (data: InvoiceType) => {
    const { sender, receiver, details } = data;

    const items = details.items || [];

    return (
        <InvoiceLayout data={data}>
            {/* Header */}
            <div className="flex justify-between items-start gap-6 border-b border-gray-200 pb-6">
                <div className="min-w-[280px]">
                    {details.invoiceLogo && (
                        <img
                            src={details.invoiceLogo}
                            alt={`Logo of ${sender.name}`}
                            className="h-16 w-auto mb-3"
                        />
                    )}
                    <h1 className="text-2xl font-semibold text-gray-900">{sender.name}</h1>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                        {(sender.city || sender.country) && (
                            <p>{[sender.city, sender.country].filter(Boolean).join(", ")}</p>
                        )}
                        {sender.email && (
                            <p>
                                <span className="font-semibold">Email:</span> {sender.email}
                            </p>
                        )}
                        {sender.phone && (
                            <>
                                {(Array.isArray(sender.phone) ? sender.phone : [sender.phone])
                                    .filter((p) => p && p.trim())
                                    .map((phone, idx) => (
                                        <p key={idx}>
                                            <span className="font-semibold">
                                                Phone{idx > 0 ? ` ${idx + 1}` : ""}:
                                            </span>{" "}
                                            {phone.trim()}
                                        </p>
                                    ))}
                            </>
                        )}
                        {sender.customInputs && sender.customInputs.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {sender.customInputs.map((input, idx) => (
                                    <p key={idx}>
                                        <span className="font-semibold">{input.key}:</span>{" "}
                                        {input.value}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase tracking-wide text-gray-900">
                        Invoice
                    </h2>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                        <p>
                            <span className="font-semibold">Invoice #:</span>{" "}
                            {details.invoiceNumber}
                        </p>
                        <p>
                            <span className="font-semibold">Invoice Date:</span>{" "}
                            {new Date(details.invoiceDate).toLocaleDateString(
                                "en-US",
                                DATE_OPTIONS
                            )}
                        </p>
                        {details.dueDate && (
                            <p>
                                <span className="font-semibold">Due Date:</span>{" "}
                                {new Date(details.dueDate).toLocaleDateString(
                                    "en-US",
                                    DATE_OPTIONS
                                )}
                            </p>
                        )}
                        {details.purchaseOrderNumber && (
                            <p>
                                <span className="font-semibold">PO #:</span>{" "}
                                {details.purchaseOrderNumber}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bill To */}
            <div className="mt-6">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
                    Billed To
                </p>
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <p className="font-semibold text-gray-900">{receiver.name}</p>
                    <div className="mt-1 text-sm text-gray-700 space-y-1">
                        {(receiver.city || receiver.country) && (
                            <p>{[receiver.city, receiver.country].filter(Boolean).join(", ")}</p>
                        )}
                        {receiver.email && (
                            <p>
                                <span className="font-semibold">Email:</span> {receiver.email}
                            </p>
                        )}
                        {receiver.phone && (
                            <>
                                {(Array.isArray(receiver.phone) ? receiver.phone : [receiver.phone])
                                    .filter((p) => p && p.trim())
                                    .map((phone, idx) => (
                                        <p key={idx}>
                                            <span className="font-semibold">
                                                Phone{idx > 0 ? ` ${idx + 1}` : ""}:
                                            </span>{" "}
                                            {phone.trim()}
                                        </p>
                                    ))}
                            </>
                        )}
                        {receiver.customInputs && receiver.customInputs.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {receiver.customInputs.map((input, idx) => (
                                    <p key={idx}>
                                        <span className="font-semibold">{input.key}:</span>{" "}
                                        {input.value}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-widest">
                                Description
                            </th>
                            {details.showPassengerName && (
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-widest">
                                    Passenger
                                </th>
                            )}
                            {details.showServiceType && (
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-widest">
                                    Service
                                </th>
                            )}
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-widest">
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                    <div className="font-medium">{item.name}</div>
                                    {item.description && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            {item.description}
                                        </div>
                                    )}
                                </td>
                                {details.showPassengerName && (
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                        {item.passengerName || "-"}
                                    </td>
                                )}
                                {details.showServiceType && (
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                        {item.serviceType || "-"}
                                    </td>
                                )}
                                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                    {formatNumberWithCommas(Number(item.total) || 0)}{" "}
                                    {details.currency}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals / Notes */}
            <div className="mt-6 flex flex-wrap justify-between gap-6">
                <div className="min-w-[280px] flex-1">
                    {details.additionalNotes && (
                        <div className="text-sm text-gray-700">
                            <p className="font-semibold uppercase tracking-widest text-xs text-gray-700">
                                Notes
                            </p>
                            <p className="mt-2 whitespace-pre-wrap">{details.additionalNotes}</p>
                        </div>
                    )}
                    {details.paymentTerms && (
                        <div className="text-sm text-gray-700 mt-4">
                            <p className="font-semibold uppercase tracking-widest text-xs text-gray-700">
                                Payment Terms
                            </p>
                            <p className="mt-2 whitespace-pre-wrap">{details.paymentTerms}</p>
                        </div>
                    )}
                </div>

                <div className="min-w-[260px]">
                    <div className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between text-sm text-gray-700">
                            <span>Subtotal</span>
                            <span className="font-medium">
                                {formatNumberWithCommas(Number(details.subTotal) || 0)}{" "}
                                {details.currency}
                            </span>
                        </div>
                        <div className="mt-2 flex justify-between text-base text-gray-900">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold">
                                {formatNumberWithCommas(Number(details.totalAmount) || 0)}{" "}
                                {details.currency}
                            </span>
                        </div>
                        {details.totalAmountInWords && (
                            <p className="mt-3 text-xs text-gray-600 italic">
                                Amount in words: {details.totalAmountInWords} {details.currency}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment instructions + Receiver signature section (toggled) */}
            <PaymentInstructionsSection data={data} />
        </InvoiceLayout>
    );
};

export default InvoiceTemplate3;
