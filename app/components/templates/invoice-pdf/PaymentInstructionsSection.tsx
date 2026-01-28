import React from "react";
import { InvoiceType } from "@/types";
import { isImageUrl } from "@/lib/helpers";
import ReceiverSignatureSection from "./ReceiverSignatureSection";

type PaymentInstructionsSectionProps = {
    data: InvoiceType;
};

const PaymentInstructionsSection = ({ data }: PaymentInstructionsSectionProps) => {
    const { sender, details } = data;
    const paymentInfo = details.paymentInformation;
    const showReceiverSection = details.showReceiverSignatureSection;

    // Handle both single object and array formats
    const paymentInfoArray = Array.isArray(paymentInfo) ? paymentInfo : paymentInfo ? [paymentInfo] : [];
    const hasPaymentInfo = paymentInfoArray.length > 0;
    const hasSignature = details.signature?.data;

    // If no payment info and no receiver section, only show signature if it exists
    if (!hasPaymentInfo && !showReceiverSection && hasSignature && details.signature) {
        const signature = details.signature;
        return (
            <div className="mt-8 border-t border-gray-300 pt-6">
                <div className="flex justify-end">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-2">
                            Authorized Signature
                        </p>
                        {isImageUrl(signature.data) ? (
                            <img
                                src={signature.data}
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
                                        fontFamily: `${signature.fontFamily || "Dancing Script"}, cursive`,
                                        margin: 0,
                                        textAlign: "center",
                                    }}
                                >
                                    {signature.data}
                                </p>
                            </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2 font-medium">{sender.name}</p>
                    </div>
                </div>
            </div>
        );
    }

    // If no payment info but receiver section is enabled
    if (!hasPaymentInfo && showReceiverSection) {
        return (
            <div className="mt-8 border-t border-gray-300 pt-6">
                <div className="flex justify-between items-start gap-8">
                    <ReceiverSignatureSection data={data} />
                    {hasSignature && details.signature && (
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
        );
    }

    return (
        <>
            {/* Payment Instructions */}
            <div className="mt-8 border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-4">
                    PAYMENT INSTRUCTIONS
                </h3>
                <div className="space-y-4">
                    {paymentInfoArray.map((info, index) => (
                        <div key={index} className="text-sm text-gray-700 space-y-1">
                            {info.bankName && (
                                <p>
                                    <span className="font-semibold">Bank:</span> {info.bankName}
                                </p>
                            )}
                            {info.accountName && (
                                <p>
                                    <span className="font-semibold">Account Name:</span> {info.accountName}
                                </p>
                            )}
                            {info.accountNumber && (
                                <p>
                                    <span className="font-semibold">Account Number:</span> {info.accountNumber}
                                </p>
                            )}
                            {info.iban && (
                                <p>
                                    <span className="font-semibold">IBAN No:</span> {info.iban}
                                </p>
                            )}
                            {info.swiftCode && (
                                <p>
                                    <span className="font-semibold">SWIFT Code:</span> {info.swiftCode}
                                </p>
                            )}
                            {index < paymentInfoArray.length - 1 && (
                                <div className="border-t border-gray-200 my-3" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Receiver Signature Section + Authorized Signature (comes after payment instructions) */}
            {(showReceiverSection || hasSignature) && (
                <div className="mt-8 border-t border-gray-300 pt-6">
                    <div className="flex justify-between items-start gap-8">
                        {showReceiverSection ? (
                            <ReceiverSignatureSection data={data} />
                        ) : (
                            <div></div>
                        )}
                        {hasSignature && details.signature && (
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
            )}
        </>
    );
};

export default PaymentInstructionsSection;

