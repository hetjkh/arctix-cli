"use client";

import React, { useEffect } from "react";

// RHF
import { FormProvider, useForm } from "react-hook-form";

// Zod
import { zodResolver } from "@hookform/resolvers/zod";

// Schema
import { InvoiceSchema } from "@/lib/schemas";

// Context
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { InvoiceContextProvider } from "@/contexts/InvoiceContext";
import { ChargesContextProvider } from "@/contexts/ChargesContext";
import { ColumnNamesProvider } from "@/contexts/ColumnNamesContext";
import { InvoiceSettingsProvider } from "@/contexts/InvoiceSettingsContext";

// Types
import { InvoiceType } from "@/types";

// Variables
import {
  FORM_DEFAULT_VALUES,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
} from "@/lib/variables";

// Helpers
import { getCurrentInvoiceNumber, getNextInvoiceNumber } from "@/lib/helpers";

// Helpers
const readDraftFromLocalStorage = (): InvoiceType | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // revive dates
    if (parsed?.details) {
      if (parsed.details.invoiceDate)
        parsed.details.invoiceDate = new Date(parsed.details.invoiceDate);
      if (parsed.details.dueDate)
        parsed.details.dueDate = new Date(parsed.details.dueDate);
      else
        // Remove dueDate if it doesn't exist
        delete parsed.details.dueDate;
    }
    // Migrate phone from string to array for backward compatibility
    if (parsed?.sender?.phone && typeof parsed.sender.phone === "string") {
      parsed.sender.phone = parsed.sender.phone ? [parsed.sender.phone] : [""];
    } else if (!parsed?.sender?.phone || !Array.isArray(parsed.sender.phone)) {
      parsed.sender.phone = [""];
    }
    if (parsed?.receiver?.phone && typeof parsed.receiver.phone === "string") {
      parsed.receiver.phone = parsed.receiver.phone ? [parsed.receiver.phone] : [""];
    } else if (!parsed?.receiver?.phone || !Array.isArray(parsed.receiver.phone)) {
      parsed.receiver.phone = [""];
    }
    return parsed;
  } catch {
    return null;
  }
};

type ProvidersProps = {
  children: React.ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
  const form = useForm<InvoiceType>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  });

  // Hydrate once on mount
  useEffect(() => {
    const draft = readDraftFromLocalStorage();
    if (draft) {
      // Always use the default sender values, but keep other draft data
      const mergedDraft = {
        ...draft,
        sender: FORM_DEFAULT_VALUES.sender,
        details: {
          ...draft.details,
          // Clear old default logo URLs if they exist
          invoiceLogo: (draft.details?.invoiceLogo && draft.details.invoiceLogo.trim() !== "" && 
            !draft.details.invoiceLogo.includes("res.cloudinary.com")) 
            ? draft.details.invoiceLogo 
            : "",
          // Clear old default signature URLs if they exist
          signature: (draft.details?.signature?.data && draft.details.signature.data.trim() !== "" && 
            !draft.details.signature.data.includes("res.cloudinary.com"))
            ? draft.details.signature
            : { data: "" },
          // Auto-generate invoice number if empty (use current number, don't increment)
          invoiceNumber: (draft.details?.invoiceNumber && draft.details.invoiceNumber.trim() !== "")
            ? draft.details.invoiceNumber
            : getCurrentInvoiceNumber(),
        },
      };
      form.reset(mergedDraft, { keepDefaultValues: false });
    } else {
      // If no draft, set the invoice number for a new invoice (use current number, don't increment)
      const currentInvoiceNumber = getCurrentInvoiceNumber();
      form.setValue("details.invoiceNumber", currentInvoiceNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <InvoiceSettingsProvider>
          <ColumnNamesProvider>
            <TranslationProvider>
              <FormProvider {...form}>
                <InvoiceContextProvider>
                  <ChargesContextProvider>{children}</ChargesContextProvider>
                </InvoiceContextProvider>
              </FormProvider>
            </TranslationProvider>
          </ColumnNamesProvider>
        </InvoiceSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Providers;
