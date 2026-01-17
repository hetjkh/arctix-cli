"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface InvoiceSettingsContextType {
    isSettingsOpen: boolean;
    openSettings: () => void;
    closeSettings: () => void;
    toggleSettings: () => void;
}

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType | undefined>(undefined);

export const InvoiceSettingsProvider = ({ children }: { children: ReactNode }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);
    const toggleSettings = () => setIsSettingsOpen(prev => !prev);

    return (
        <InvoiceSettingsContext.Provider
            value={{
                isSettingsOpen,
                openSettings,
                closeSettings,
                toggleSettings,
            }}
        >
            {children}
        </InvoiceSettingsContext.Provider>
    );
};

export const useInvoiceSettings = () => {
    const context = useContext(InvoiceSettingsContext);
    if (context === undefined) {
        throw new Error("useInvoiceSettings must be used within an InvoiceSettingsProvider");
    }
    return context;
};

