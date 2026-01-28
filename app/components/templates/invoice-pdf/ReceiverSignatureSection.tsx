import React from "react";
import { InvoiceType } from "@/types";

type ReceiverSignatureSectionProps = {
    data: InvoiceType;
};

const ReceiverSignatureSection = ({ data }: ReceiverSignatureSectionProps) => {
    const { sender, receiver, details } = data;

    // Only render if toggle is enabled
    if (!details.showReceiverSignatureSection) {
        return null;
    }

    return (
        <div className="text-left space-y-6 flex-1">
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
    );
};

export default ReceiverSignatureSection;

