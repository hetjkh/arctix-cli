"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";

// RHF
import { useFormContext } from "react-hook-form";

// Hooks
import useToasts from "@/hooks/useToasts";
import { useAuth } from "@/contexts/AuthContext";

// ShadCn
import { toast } from "@/components/ui/use-toast";

// Services
import { exportInvoice } from "@/services/invoice/client/exportInvoice";
import { saveFileToDirectory } from "@/services/invoice/client/downloadToDirectory";

// Variables
import {
  FORM_DEFAULT_VALUES,
  GENERATE_PDF_API,
  SEND_PDF_API,
  SHORT_DATE_OPTIONS,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
} from "@/lib/variables";

// Helpers
import { getNextInvoiceNumber } from "@/lib/helpers";

// Types
import { ExportTypes, InvoiceType } from "@/types";

const defaultInvoiceContext = {
  invoicePdf: new Blob(),
  invoicePdfLoading: false,
  savedInvoices: [] as InvoiceType[],
  pdfUrl: null as string | null,
  onFormSubmit: (values: InvoiceType) => {},
  newInvoice: () => {},
  generatePdf: async (data: InvoiceType) => {},
  removeFinalPdf: () => {},
  downloadPdf: async () => {},
  printPdf: () => {},
  previewPdfInTab: () => {},
  saveInvoice: () => {},
  deleteInvoice: (index: number) => {},
  sendPdfToMail: (email: string): Promise<void> => Promise.resolve(),
  exportInvoiceAs: (exportAs: ExportTypes) => {},
  importInvoice: async (file: File) => {},
};

export const InvoiceContext = createContext(defaultInvoiceContext);

export const useInvoiceContext = () => {
  return useContext(InvoiceContext);
};

type InvoiceContextProviderProps = {
  children: React.ReactNode;
};

export const InvoiceContextProvider = ({
  children,
}: InvoiceContextProviderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Toasts
  const {
    newInvoiceSuccess,
    pdfGenerationSuccess,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
    sendPdfSuccess,
    sendPdfError,
    importInvoiceError,
    importInvoiceSuccess,
    downloadSuccess,
  } = useToasts();

  // Get form values and methods from form context
  const { getValues, reset, watch, setValue } = useFormContext<InvoiceType>();

  // Variables
  const [invoicePdf, setInvoicePdf] = useState<Blob>(new Blob());
  const [invoicePdfLoading, setInvoicePdfLoading] = useState<boolean>(false);

  // Saved invoices
  const [savedInvoices, setSavedInvoices] = useState<InvoiceType[]>([]);

  // Load invoices from database or localStorage
  useEffect(() => {
    const loadInvoices = async () => {
      if (user) {
        // Load from database
        try {
          const response = await fetch("/api/invoice/list");
          if (response.ok) {
            const data = await response.json();
            setSavedInvoices(data.invoices || []);
          } else {
            setSavedInvoices([]);
          }
        } catch (error) {
          console.error("Error loading invoices:", error);
          setSavedInvoices([]);
        }
      } else {
        // Load from localStorage
        if (typeof window !== "undefined") {
          try {
            const savedInvoicesJSON = window.localStorage.getItem("savedInvoices");
            const savedInvoicesDefault = savedInvoicesJSON
              ? JSON.parse(savedInvoicesJSON)
              : [];
            setSavedInvoices(savedInvoicesDefault);
          } catch (error) {
            console.error("Error parsing saved invoices from localStorage:", error);
            // Clear corrupted data
            window.localStorage.removeItem("savedInvoices");
            setSavedInvoices([]);
          }
        }
      }
    };

    loadInvoices();
  }, [user]);

  // Load invoice by ID from query parameter
  useEffect(() => {
    const invoiceId = searchParams?.get("invoiceId");
    if (invoiceId && user) {
      const loadInvoiceById = async () => {
        try {
          const response = await fetch(`/api/invoice/${invoiceId}`);
          if (response.ok) {
            const data = await response.json();
            const invoice = data.invoice;
            
            // Remove database-specific fields
            if (invoice.id) delete invoice.id;
            if (invoice._id) delete invoice._id;
            if (invoice.userId) delete invoice.userId;
            if (invoice.createdAt) delete invoice.createdAt;
            
            // Transform dates
            if (invoice.details.dueDate) {
              invoice.details.dueDate = new Date(invoice.details.dueDate);
            }
            if (invoice.details.invoiceDate) {
              invoice.details.invoiceDate = new Date(invoice.details.invoiceDate);
            }
            
            // Migrate phone from string to array for backward compatibility
            if (invoice?.sender?.phone && typeof invoice.sender.phone === "string") {
              invoice.sender.phone = invoice.sender.phone ? [invoice.sender.phone] : [""];
            } else if (!invoice?.sender?.phone || !Array.isArray(invoice.sender.phone)) {
              invoice.sender.phone = [""];
            }
            if (invoice?.receiver?.phone && typeof invoice.receiver.phone === "string") {
              invoice.receiver.phone = invoice.receiver.phone ? [invoice.receiver.phone] : [""];
            } else if (!invoice?.receiver?.phone || !Array.isArray(invoice.receiver.phone)) {
              invoice.receiver.phone = [""];
            }
            
            // Reset form with invoice data
            reset(invoice);
            
            // Remove query parameter from URL
            const url = new URL(window.location.href);
            url.searchParams.delete("invoiceId");
            router.replace(url.pathname + url.search);
          }
        } catch (error) {
          console.error("Error loading invoice:", error);
        }
      };
      
      loadInvoiceById();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  // Persist full form state with debounce
  useEffect(() => {
    if (typeof window === "undefined") return;
    const subscription = watch((value) => {
      try {
        window.localStorage.setItem(
          LOCAL_STORAGE_INVOICE_DRAFT_KEY,
          JSON.stringify(value)
        );
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Get pdf url from blob
  const pdfUrl = useMemo(() => {
    if (invoicePdf.size > 0) {
      return window.URL.createObjectURL(invoicePdf);
    }
    return null;
  }, [invoicePdf]);

  /**
   * Handles form submission.
   *
   * @param {InvoiceType} data - The form values used to generate the PDF.
   */
  const onFormSubmit = (data: InvoiceType) => {
    console.log("VALUE");
    console.log(data);

    // Call generate pdf method
    generatePdf(data);
  };

  /**
   * Generates a new invoice.
   */
  const newInvoice = () => {
    // Get the next invoice number
    const nextInvoiceNumber = getNextInvoiceNumber();
    
    // Reset form with default values and set the new invoice number
    const defaultValuesWithInvoiceNumber = {
      ...FORM_DEFAULT_VALUES,
      details: {
        ...FORM_DEFAULT_VALUES.details,
        invoiceNumber: nextInvoiceNumber,
      },
    };
    
    reset(defaultValuesWithInvoiceNumber);
    setInvoicePdf(new Blob());

    // Clear the draft
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
      } catch {}
    }

    router.refresh();

    // Toast
    newInvoiceSuccess();
  };

  /**
   * Generate a PDF document based on the provided data.
   *
   * @param {InvoiceType} data - The data used to generate the PDF.
   * @returns {Promise<void>} - A promise that resolves when the PDF is successfully generated.
   * @throws {Error} - If an error occurs during the PDF generation process.
   */
  const generatePdf = useCallback(async (data: InvoiceType) => {
    setInvoicePdfLoading(true);

    try {
      const response = await fetch(GENERATE_PDF_API, {
        method: "POST",
        body: JSON.stringify(data),
      });

      const result = await response.blob();
      setInvoicePdf(result);

      if (result.size > 0) {
        // Toast
        pdfGenerationSuccess();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setInvoicePdfLoading(false);
    }
  }, []);

  /**
   * Removes the final PDF file and switches to Live Preview
   */
  const removeFinalPdf = () => {
    setInvoicePdf(new Blob());
  };

  /**
   * Generates a preview of a PDF file and opens it in a new browser tab.
   */
  const previewPdfInTab = () => {
    if (invoicePdf) {
      const url = window.URL.createObjectURL(invoicePdf);
      window.open(url, "_blank");
    }
  };

  /**
   * Downloads a PDF file.
   */
  const downloadPdf = async () => {
    // Only download if there is an invoice
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      // Get invoice number from form values
      const formValues = getValues();
      const invoiceNumber = formValues.details.invoiceNumber || "invoice";
      // Sanitize filename (remove invalid characters)
      const sanitizedInvoiceNumber = invoiceNumber.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `${sanitizedInvoiceNumber}.pdf`;
      
      // Try to save to preferred directory first
      const saved = await saveFileToDirectory(invoicePdf, filename);
      
      if (!saved) {
        // Fallback to default browser download
        const url = window.URL.createObjectURL(invoicePdf);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      // Show success message
      downloadSuccess(invoiceNumber || undefined);
    }
  };

  /**
   * Prints a PDF file.
   */
  const printPdf = () => {
    if (invoicePdf) {
      const pdfUrl = URL.createObjectURL(invoicePdf);
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  // TODO: Change function name. (saveInvoiceData maybe?)
  /**
   * Saves the invoice data to database (if logged in) or local storage.
   */
  const saveInvoice = async () => {
    if (invoicePdf) {
      // If get values function is provided, allow to save the invoice
      if (getValues) {
        const formValues = getValues();
        const updatedDate = new Date().toLocaleDateString(
          "en-US",
          SHORT_DATE_OPTIONS
        );
        formValues.details.updatedAt = updatedDate;

        if (user) {
          // Save to database
          try {
            const response = await fetch("/api/invoice/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formValues),
            });

            if (response.ok) {
              const data = await response.json();
              
              // Check if invoice already existed
              const existingInvoiceIndex = savedInvoices.findIndex(
                (invoice: InvoiceType) => {
                  return (
                    invoice.details.invoiceNumber === formValues.details.invoiceNumber
                  );
                }
              );

              if (existingInvoiceIndex !== -1) {
                // Update in local state
                const updated = [...savedInvoices];
                updated[existingInvoiceIndex] = formValues;
                setSavedInvoices(updated);
                modifiedInvoiceSuccess();
              } else {
                // Add to local state
                setSavedInvoices([...savedInvoices, formValues]);
                saveInvoiceSuccess();
              }
            } else {
              const error = await response.json();
              console.error("Save error:", error);
              toast({
                variant: "destructive",
                title: "Save failed",
                description: error.error || "Could not save invoice",
              });
            }
          } catch (error) {
            console.error("Save error:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to save invoice. Please try again.",
            });
          }
        } else {
          // Save to localStorage
          let savedInvoices: InvoiceType[] = [];
          try {
            const savedInvoicesJSON = localStorage.getItem("savedInvoices");
            savedInvoices = savedInvoicesJSON
              ? JSON.parse(savedInvoicesJSON)
              : [];
          } catch (error) {
            console.error("Error parsing saved invoices from localStorage:", error);
            // Clear corrupted data
            localStorage.removeItem("savedInvoices");
            savedInvoices = [];
          }

          const existingInvoiceIndex = savedInvoices.findIndex(
            (invoice: InvoiceType) => {
              return (
                invoice.details.invoiceNumber === formValues.details.invoiceNumber
              );
            }
          );

          // If invoice already exists
          if (existingInvoiceIndex !== -1) {
            savedInvoices[existingInvoiceIndex] = formValues;
            modifiedInvoiceSuccess();
          } else {
            // Add the form values to the array
            savedInvoices.push(formValues);
            saveInvoiceSuccess();
          }

          localStorage.setItem("savedInvoices", JSON.stringify(savedInvoices));
          setSavedInvoices(savedInvoices);
        }
      }
    }
  };

  // TODO: Change function name. (deleteInvoiceData maybe?)
  /**
   * Delete an invoice from database (if logged in) or local storage.
   *
   * @param {number} index - The index of the invoice to be deleted.
   */
  const deleteInvoice = async (index: number) => {
    if (index >= 0 && index < savedInvoices.length) {
      const invoice = savedInvoices[index];
      
      // Get invoice ID - check both 'id' and '_id' fields
      const invoiceId = (invoice as any).id || (invoice as any)._id;
      
      if (user && invoiceId) {
        // Delete from database
        try {
          console.log("Deleting invoice with ID:", invoiceId);
          const response = await fetch(`/api/invoice/${invoiceId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            const result = await response.json();
            console.log("Delete response:", result);
            
            // Dispatch custom event immediately to notify other components (like ClientDetail) to refresh
            // This ensures the client detail page updates even if invoice list reload fails
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("invoiceDeleted", {
                detail: { invoiceId: invoiceId }
              }));
            }
            
            // Show success toast
            toast({
              title: "Success",
              description: "Invoice deleted successfully",
            });
            
            // Reload invoices from database to ensure consistency across all views
            try {
              const listResponse = await fetch("/api/invoice/list", {
                cache: "no-store",
              });
              if (listResponse.ok) {
                const data = await listResponse.json();
                setSavedInvoices(data.invoices || []);
              } else {
                console.error("Failed to reload invoices after delete");
                // Fallback: Remove from local state if reload fails
                const updatedInvoices = [...savedInvoices];
                updatedInvoices.splice(index, 1);
                setSavedInvoices(updatedInvoices);
              }
            } catch (reloadError) {
              console.error("Error reloading invoices:", reloadError);
              // Fallback: Remove from local state if reload fails
              const updatedInvoices = [...savedInvoices];
              updatedInvoices.splice(index, 1);
              setSavedInvoices(updatedInvoices);
            }
          } else {
            const error = await response.json();
            console.error("Delete failed:", error);
            toast({
              variant: "destructive",
              title: "Delete failed",
              description: error.error || "Could not delete invoice",
            });
          }
        } catch (error) {
          console.error("Delete error:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete invoice. Please try again.",
          });
        }
      } else {
        // Delete from localStorage (when not logged in or invoice has no ID)
        console.log("Deleting from localStorage - user:", user, "invoiceId:", invoiceId);
        const updatedInvoices = [...savedInvoices];
        updatedInvoices.splice(index, 1);
        setSavedInvoices(updatedInvoices);

        const updatedInvoicesJSON = JSON.stringify(updatedInvoices);
        localStorage.setItem("savedInvoices", updatedInvoicesJSON);
        
        // Dispatch custom event to notify other components (like ClientDetail) to refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("invoiceDeleted", {
            detail: { invoiceId: invoiceId || invoice.details?.invoiceNumber }
          }));
        }
        
        toast({
          title: "Success",
          description: "Invoice deleted successfully",
        });
      }
    } else {
      console.error("Invalid index for delete:", index, "savedInvoices length:", savedInvoices.length);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid invoice index",
      });
    }
  };

  /**
   * Send the invoice PDF to the specified email address.
   *
   * @param {string} email - The email address to which the Invoice PDF will be sent.
   * @returns {Promise<void>} A promise that resolves once the email is successfully sent.
   */
  const sendPdfToMail = (email: string) => {
    const fd = new FormData();
    fd.append("email", email);
    fd.append("invoicePdf", invoicePdf, "invoice.pdf");
    fd.append("invoiceNumber", getValues().details.invoiceNumber);

    return fetch(SEND_PDF_API, {
      method: "POST",
      body: fd,
    })
      .then((res) => {
        if (res.ok) {
          // Successful toast msg
          sendPdfSuccess();
        } else {
          // Error toast msg
          sendPdfError({ email, sendPdfToMail });
        }
      })
      .catch((error) => {
        console.log(error);

        // Error toast msg
        sendPdfError({ email, sendPdfToMail });
      });
  };

  /**
   * Export an invoice in the specified format using the provided form values.
   *
   * This function initiates the export process with the chosen export format and the form data.
   *
   * @param {ExportTypes} exportAs - The format in which to export the invoice.
   */
  const exportInvoiceAs = (exportAs: ExportTypes) => {
    const formValues = getValues();

    // Service to export invoice with given parameters
    exportInvoice(exportAs, formValues);
  };

  /**
   * Import an invoice from a JSON or Excel file.
   *
   * @param {File} file - The JSON or Excel file to import.
   */
  const importInvoice = async (file: File) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Handle JSON files
    if (fileType === 'application/json' || fileName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          processImportedData(importedData);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          importInvoiceError();
        }
      };
      reader.readAsText(file);
      return;
    }

    // Handle Excel files
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      try {
        // Dynamically import xlsx library (client-side)
        const XLSX = (await import('xlsx')).default;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // Try to read from hidden JSON sheet first (for complete data with logo/signature)
            let importedData = null;
            const jsonSheetName = workbook.SheetNames.find(name => name === '_JSON_DATA');
            
            if (jsonSheetName) {
              const jsonSheet = workbook.Sheets[jsonSheetName];
              const jsonData = XLSX.utils.sheet_to_json(jsonSheet, { header: 1, defval: '' });
              
              // The JSON is base64 encoded starting from the second row (index 1)
              // It might be split across multiple rows
              if (jsonData.length > 1) {
                // Skip header row and concatenate all base64 chunks
                let base64String = '';
                const dataRows = jsonData.slice(1);
                
                for (let i = 0; i < dataRows.length; i++) {
                  const row = dataRows[i];
                  if (Array.isArray(row) && row.length > 0) {
                    base64String += String(row[0] || '');
                  } else if (typeof row === 'string') {
                    base64String += row;
                  }
                }
                
                if (base64String && base64String.trim().length > 0) {
                  try {
                    // Decode base64 to get JSON string
                    const jsonString = Buffer.from(base64String, 'base64').toString('utf8');
                    importedData = JSON.parse(jsonString);
                  } catch (parseError) {
                    console.error("Error parsing base64 JSON from Excel:", parseError);
                    // Fallback: try parsing as direct JSON if it looks like JSON
                    try {
                      const trimmed = base64String.trim();
                      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                        importedData = JSON.parse(trimmed);
                      }
                    } catch (fallbackError) {
                      console.error("Error parsing JSON from Excel (fallback):", fallbackError);
                    }
                  }
                }
              }
            }

            // If no JSON sheet found, try to reconstruct from flattened data
            if (!importedData) {
              const mainSheetName = workbook.SheetNames[0];
              const mainSheet = workbook.Sheets[mainSheetName];
              const flattenedData = XLSX.utils.sheet_to_json(mainSheet);
              
              if (flattenedData.length > 0) {
                // Try to reconstruct nested structure from flattened keys
                // This is a fallback - may not preserve all nested structures perfectly
                importedData = reconstructFromFlattened(flattenedData[0] as Record<string, any>);
              }
            }

            if (importedData) {
              processImportedData(importedData);
            } else {
              throw new Error('Could not extract invoice data from Excel file');
            }
          } catch (error) {
            console.error("Error parsing Excel file:", error);
            importInvoiceError();
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error loading Excel library:", error);
        importInvoiceError();
      }
      return;
    }

    // Unsupported file type
    importInvoiceError();
  };

  /**
   * Process imported invoice data and reset the form.
   *
   * @param {any} importedData - The imported invoice data.
   */
  const processImportedData = (importedData: any) => {
    // Parse the dates
    if (importedData.details) {
      if (importedData.details.invoiceDate) {
        importedData.details.invoiceDate = new Date(
          importedData.details.invoiceDate
        );
      }
      if (importedData.details.dueDate) {
        importedData.details.dueDate = new Date(
          importedData.details.dueDate
        );
      } else {
        // Remove dueDate if it doesn't exist
        delete importedData.details.dueDate;
      }
    }

    // Reset form with imported data
    reset(importedData);
    
    // Show success toast
    importInvoiceSuccess();
  };

  /**
   * Reconstruct nested object from flattened keys (e.g., "details.invoiceNumber" -> details: { invoiceNumber: ... })
   * This is a fallback method when JSON sheet is not available.
   *
   * @param {Record<string, any>} flattened - The flattened object.
   * @returns {any} The reconstructed nested object.
   */
  const reconstructFromFlattened = (flattened: Record<string, any>): any => {
    const result: any = {};
    
    for (const [key, value] of Object.entries(flattened)) {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
    }
    
    return result;
  };


  return (
    <InvoiceContext.Provider
      value={{
        invoicePdf,
        invoicePdfLoading,
        savedInvoices,
        pdfUrl,
        onFormSubmit,
        newInvoice,
        generatePdf,
        removeFinalPdf,
        downloadPdf,
        printPdf,
        previewPdfInTab,
        saveInvoice,
        deleteInvoice,
        sendPdfToMail,
        exportInvoiceAs,
        importInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
