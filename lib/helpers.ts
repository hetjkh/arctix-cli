// Next
import { NextResponse } from "next/server";

// Utils
import numberToWords from "number-to-words";

// Currencies
import currenciesDetails from "@/public/assets/data/currencies.json";
import { CurrencyDetails } from "@/types";

// Variables
import { LOCAL_STORAGE_LAST_INVOICE_NUMBER_KEY } from "@/lib/variables";

/**
 * Formats a number with commas and decimal places
 *
 * @param {number} number - Number to format
 * @returns {string} A styled number to be displayed on the invoice
 */
const formatNumberWithCommas = (number: number) => {
    return number.toLocaleString("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/**
 * Formats a number with commas but without decimal places
 *
 * @param {number} number - Number to format
 * @returns {string} A styled number without decimals to be displayed on the invoice
 */
const formatNumberWithCommasNoDecimals = (number: number) => {
    return Math.round(number).toLocaleString("en-US", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

/**
 * @param {string} currency - The currency that is currently selected 
 * @returns {Object} - An object containing the currency details as
 * ```
 * {
    "currency": "United Arab Emirates Dirham",
    "decimals": 2,
    "beforeDecimal": "Dirham",
    "afterDecimal": "Fils"
 }
 */
 const fetchCurrencyDetails = (currency: string): CurrencyDetails | null => {
    const data = currenciesDetails as Record<string, CurrencyDetails>;
    const currencyDetails = data[currency];
    return currencyDetails || null;
};


/**
 * Turns a number into words for invoices
 *
 * @param {number} price - Number to format
 * @returns {string} Number in words
 */
const formatPriceToString = (price: number, currency: string): string => {
    // Initialize variables
    let decimals : number;
    let beforeDecimal: string | null = null;
    let afterDecimal: string | null = null;
    
    const currencyDetails = fetchCurrencyDetails(currency);

    // If currencyDetails is available, use its values, else dynamically set decimals
    if (currencyDetails) {
        decimals = currencyDetails.decimals;
        beforeDecimal = currencyDetails.beforeDecimal;
        afterDecimal = currencyDetails.afterDecimal;
    } else {
        // Dynamically get decimals from the price if currencyDetails is null
        const priceString = price.toString();
        const decimalIndex = priceString.indexOf('.');
        decimals = decimalIndex !== -1 ? priceString.split('.')[1].length : 0;
    }

    // Ensure the price is rounded to the appropriate decimal places
    const roundedPrice = parseFloat(price.toFixed(decimals));

    // Split the price into integer and fractional parts
    const integerPart = Math.floor(roundedPrice);
    
    const fractionalMultiplier = Math.pow(10, decimals);
    const fractionalPart = Math.round((roundedPrice - integerPart) * fractionalMultiplier);

    // Convert the integer part to words with a capitalized first letter
    const integerPartInWords = numberToWords
        .toWords(integerPart)
        .replace(/^\w/, (c) => c.toUpperCase());

    // Convert fractional part to words
    const fractionalPartInWords =
        fractionalPart > 0
            ? numberToWords.toWords(fractionalPart)
            : null;

    // Handle zero values for both parts
    if (integerPart === 0 && fractionalPart === 0) {
        return "Zero";
    }

    // Combine the parts into the final string
    let result = integerPartInWords;

    // Check if beforeDecimal is not null 
    if (beforeDecimal !== null) {
        result += ` ${beforeDecimal}`;
    }

    if (fractionalPartInWords) {
        // Check if afterDecimal is not null
        if (afterDecimal !== null) {
            // Concatenate the after decimal and fractional part
            result += ` and ${fractionalPartInWords} ${afterDecimal}`;
        } else {
            // If afterDecimal is null, concatenate the fractional part
            result += ` point ${fractionalPartInWords}`;
        }
    }

    return result;
};

/**
 * This method flattens a nested object. It is used for xlsx export
 *
 * @param {Record<string, T>} obj - A nested object to flatten
 * @param {string} parentKey - The parent key
 * @returns {Record<string, T>} A flattened object
 */
const flattenObject = <T>(
    obj: Record<string, T>,
    parentKey = ""
): Record<string, T> => {
    const result: Record<string, T> = {};

    for (const key in obj) {
        if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
            const flattened = flattenObject(
                obj[key] as Record<string, T>,
                parentKey + key + "_"
            );
            for (const subKey in flattened) {
                result[parentKey + subKey] = flattened[subKey];
            }
        } else {
            result[parentKey + key] = obj[key];
        }
    }

    return result;
};

/**
 * A method to validate an email address
 *
 * @param {string} email - Email to validate
 * @returns {boolean} A boolean indicating if the email is valid
 */
const isValidEmail = (email: string) => {
    // Regular expression for a simple email pattern
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
};

/**
 * A method to check if a string is a data URL
 *
 * @param {string} str - String to check
 * @returns {boolean} Boolean indicating if the string is a data URL
 */
const isDataUrl = (str: string) => str.startsWith("data:");

/**
 * A method to check if a string is an image URL (data URL or HTTP/HTTPS URL)
 *
 * @param {string} str - String to check
 * @returns {boolean} Boolean indicating if the string is an image URL
 */
const isImageUrl = (str: string) => {
    if (!str) return false;
    // Check if it's a data URL
    if (str.startsWith("data:")) return true;
    // Check if it's an HTTP/HTTPS URL (likely an image)
    if (str.startsWith("http://") || str.startsWith("https://")) {
        // Check for common image extensions
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const lowerStr = str.toLowerCase();
        return imageExtensions.some(ext => lowerStr.includes(ext));
    }
    return false;
};

/**
 * Gets the current invoice number without incrementing
 * @returns {string} The current invoice number as a string (returns "1" if none exists)
 */
const getCurrentInvoiceNumber = (): string => {
    if (typeof window === "undefined") return "1";
    
    try {
        const lastNumberStr = window.localStorage.getItem(LOCAL_STORAGE_LAST_INVOICE_NUMBER_KEY);
        if (!lastNumberStr) {
            // If no number exists, return "1" for the first invoice
            return "1";
        }
        const lastNumber = parseInt(lastNumberStr, 10);
        // Return the last number (which is the current highest invoice number)
        return lastNumber.toString();
    } catch {
        return "1";
    }
};

/**
 * Gets the next invoice number and increments the counter
 * @returns {string} The next invoice number as a string
 */
const getNextInvoiceNumber = (): string => {
    if (typeof window === "undefined") return "1";
    
    try {
        const lastNumberStr = window.localStorage.getItem(LOCAL_STORAGE_LAST_INVOICE_NUMBER_KEY);
        let nextNumber: number;
        
        if (!lastNumberStr) {
            // If no number exists, start with 1
            nextNumber = 1;
        } else {
            // Increment from the last number
            const lastNumber = parseInt(lastNumberStr, 10);
            nextNumber = lastNumber + 1;
        }
        
        // Save the new number
        window.localStorage.setItem(LOCAL_STORAGE_LAST_INVOICE_NUMBER_KEY, nextNumber.toString());
        
        return nextNumber.toString();
    } catch {
        // If there's an error, set it to 1 and return it
        if (typeof window !== "undefined") {
            window.localStorage.setItem(LOCAL_STORAGE_LAST_INVOICE_NUMBER_KEY, "1");
        }
        return "1";
    }
};

/**
 * Dynamically imports and retrieves an invoice template React component based on the provided template ID.
 *
 * @param {number} templateId - The ID of the invoice template.
 * @returns {Promise<React.ComponentType<any> | null>} A promise that resolves to the invoice template component or null if not found.
 * @throws {Error} Throws an error if there is an issue with the dynamic import or if a default template is not available.
 */
const getInvoiceTemplate = async (templateId: number) => {
    // Dynamic template component name
    const componentName = `InvoiceTemplate${templateId}`;

    try {
        const module = await import(
            `@/app/components/templates/invoice-pdf/${componentName}`
        );
        return module.default;
    } catch (err) {
        console.error(`Error importing template ${componentName}: ${err}`);

        // Provide a default template
        return null;
    }
};

/**
 * Convert a file to a buffer. Used for sending invoice as email attachment.
 * @param {File} file - The file to convert to a buffer.
 * @returns {Promise<Buffer>} A promise that resolves to a buffer.
 */
const fileToBuffer = async (file: File) => {
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await new NextResponse(file).arrayBuffer();

    // Convert ArrayBuffer to Buffer
    const pdfBuffer = Buffer.from(arrayBuffer);

    return pdfBuffer;
};

export {
    formatNumberWithCommas,
    formatNumberWithCommasNoDecimals,
    formatPriceToString,
    flattenObject,
    isValidEmail,
    isDataUrl,
    isImageUrl,
    getCurrentInvoiceNumber,
    getNextInvoiceNumber,
    getInvoiceTemplate,
    fileToBuffer,
};
