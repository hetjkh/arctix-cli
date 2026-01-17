"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface ColumnNames {
    passengerName: string;
    route: string;
    airlines: string;
    serviceType: string;
    amount: string;
}

interface ExtraDeliverableColumnNames {
    name: string;
    serviceType: string;
    amount: string;
    vatPercentage: string;
    vat: string;
}

interface ShowExtraDeliverableColumns {
    name: boolean;
    serviceType: boolean;
    amount: boolean;
    vatPercentage: boolean;
    vat: boolean;
}

interface ColumnNamesContextType {
    columnNames: ColumnNames;
    setColumnNames: (names: ColumnNames) => void;
    extraDeliverableColumnNames: ExtraDeliverableColumnNames;
    setExtraDeliverableColumnNames: (names: ExtraDeliverableColumnNames) => void;
    showExtraDeliverableColumns: ShowExtraDeliverableColumns;
    setShowExtraDeliverableColumns: (columns: ShowExtraDeliverableColumns) => void;
    loading: boolean;
    saveColumnNames: () => Promise<void>;
}

const defaultColumnNames: ColumnNames = {
    passengerName: "Passenger Name",
    route: "Route",
    airlines: "Airlines",
    serviceType: "Type of Service",
    amount: "Amount",
};

const defaultExtraDeliverableColumnNames: ExtraDeliverableColumnNames = {
    name: "Extra Deliverable",
    serviceType: "Type of Service",
    amount: "Amount",
    vatPercentage: "VAT %",
    vat: "VAT Amount",
};

const defaultShowExtraDeliverableColumns: ShowExtraDeliverableColumns = {
    name: true,
    serviceType: true,
    amount: true,
    vatPercentage: true,
    vat: true,
};

const ColumnNamesContext = createContext<ColumnNamesContextType>({
    columnNames: defaultColumnNames,
    setColumnNames: () => {},
    extraDeliverableColumnNames: defaultExtraDeliverableColumnNames,
    setExtraDeliverableColumnNames: () => {},
    showExtraDeliverableColumns: defaultShowExtraDeliverableColumns,
    setShowExtraDeliverableColumns: () => {},
    loading: false,
    saveColumnNames: async () => {},
});

export const useColumnNames = () => useContext(ColumnNamesContext);

export const ColumnNamesProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [columnNames, setColumnNamesState] = useState<ColumnNames>(defaultColumnNames);
    const [extraDeliverableColumnNames, setExtraDeliverableColumnNamesState] = useState<ExtraDeliverableColumnNames>(defaultExtraDeliverableColumnNames);
    const [showExtraDeliverableColumns, setShowExtraDeliverableColumnsState] = useState<ShowExtraDeliverableColumns>(defaultShowExtraDeliverableColumns);
    const [loading, setLoading] = useState(true);

    // Load column names on mount and when user changes
    useEffect(() => {
        const loadColumnNames = async () => {
            setLoading(true);
            try {
                if (user) {
                    // Load from API if user is logged in
                    const response = await fetch("/api/user/preferences");
                    if (response.ok) {
                        const data = await response.json();
                        setColumnNamesState({
                            ...defaultColumnNames,
                            ...(data.columnNames || {}),
                        });
                        setExtraDeliverableColumnNamesState({
                            ...defaultExtraDeliverableColumnNames,
                            ...(data.extraDeliverableColumnNames || {}),
                        });
                        setShowExtraDeliverableColumnsState({
                            ...defaultShowExtraDeliverableColumns,
                            ...(data.showExtraDeliverableColumns || {}),
                        });
                    } else {
                        // Fallback to defaults
                        setColumnNamesState(defaultColumnNames);
                        setExtraDeliverableColumnNamesState(defaultExtraDeliverableColumnNames);
                        setShowExtraDeliverableColumnsState(defaultShowExtraDeliverableColumns);
                    }
                } else {
                    // Load from localStorage if not logged in
                    const saved = localStorage.getItem("columnNames");
                    const savedExtra = localStorage.getItem("extraDeliverableColumnNames");
                    const savedShowExtra = localStorage.getItem("showExtraDeliverableColumns");
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            setColumnNamesState({
                                ...defaultColumnNames,
                                ...parsed,
                            });
                        } catch {
                            setColumnNamesState(defaultColumnNames);
                        }
                    } else {
                        setColumnNamesState(defaultColumnNames);
                    }
                    if (savedExtra) {
                        try {
                            const parsed = JSON.parse(savedExtra);
                            setExtraDeliverableColumnNamesState({
                                ...defaultExtraDeliverableColumnNames,
                                ...parsed,
                            });
                        } catch {
                            setExtraDeliverableColumnNamesState(defaultExtraDeliverableColumnNames);
                        }
                    } else {
                        setExtraDeliverableColumnNamesState(defaultExtraDeliverableColumnNames);
                    }
                    if (savedShowExtra) {
                        try {
                            const parsed = JSON.parse(savedShowExtra);
                            setShowExtraDeliverableColumnsState({
                                ...defaultShowExtraDeliverableColumns,
                                ...parsed,
                            });
                        } catch {
                            setShowExtraDeliverableColumnsState(defaultShowExtraDeliverableColumns);
                        }
                    } else {
                        setShowExtraDeliverableColumnsState(defaultShowExtraDeliverableColumns);
                    }
                }
            } catch (error) {
                console.error("Error loading column names:", error);
                setColumnNamesState(defaultColumnNames);
            } finally {
                setLoading(false);
            }
        };

        loadColumnNames();
    }, [user]);

    const setColumnNames = (names: ColumnNames) => {
        setColumnNamesState(names);
        // Save to localStorage immediately for non-logged-in users
        if (!user) {
            localStorage.setItem("columnNames", JSON.stringify(names));
        }
    };

    const setExtraDeliverableColumnNames = (names: ExtraDeliverableColumnNames) => {
        setExtraDeliverableColumnNamesState(names);
        if (!user) {
            localStorage.setItem("extraDeliverableColumnNames", JSON.stringify(names));
        }
    };

    const setShowExtraDeliverableColumns = (columns: ShowExtraDeliverableColumns) => {
        setShowExtraDeliverableColumnsState(columns);
        if (!user) {
            localStorage.setItem("showExtraDeliverableColumns", JSON.stringify(columns));
        }
    };

    const saveColumnNames = async () => {
        if (!user) {
            // Already saved to localStorage in setColumnNames
            return;
        }

        try {
            const response = await fetch("/api/user/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    columnNames,
                    extraDeliverableColumnNames,
                    showExtraDeliverableColumns,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save column names");
            }
        } catch (error) {
            console.error("Error saving column names:", error);
            throw error;
        }
    };

    return (
        <ColumnNamesContext.Provider
            value={{
                columnNames,
                setColumnNames,
                extraDeliverableColumnNames,
                setExtraDeliverableColumnNames,
                showExtraDeliverableColumns,
                setShowExtraDeliverableColumns,
                loading,
                saveColumnNames,
            }}
        >
            {children}
        </ColumnNamesContext.Provider>
    );
};

