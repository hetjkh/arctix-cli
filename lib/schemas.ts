import { z } from "zod";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";

// TODO: Refactor some of the validators. Ex: name and zipCode or address and country have same rules
// Field Validators
const fieldValidators = {
    name: z
        .string()
        .min(2, { message: "Must be at least 2 characters" })
        .max(50, { message: "Must be at most 50 characters" }),
    address: z
        .string()
        .min(2, { message: "Must be at least 2 characters" })
        .max(70, { message: "Must be between 2 and 70 characters" }),
    zipCode: z
        .string()
        .min(2, { message: "Must be between 2 and 20 characters" })
        .max(20, { message: "Must be between 2 and 20 characters" }),
    city: z
        .string()
        .min(1, { message: "Must be between 1 and 50 characters" })
        .max(50, { message: "Must be between 1 and 50 characters" }),
    country: z
        .string()
        .min(1, { message: "Must be between 1 and 70 characters" })
        .max(70, { message: "Must be between 1 and 70 characters" }),
    email: z
        .string()
        .email({ message: "Email must be a valid email" })
        .min(5, { message: "Must be at least 5 characters" })
        .max(100, { message: "Must be at most 100 characters" }),
    phone: z
        .string()
        .min(1, { message: "Must be between 1 and 50 characters" })
        .max(50, {
            message: "Must be between 1 and 50 characters",
        }),

    // Dates
    date: z
        .date()
        .transform((date) =>
            new Date(date).toLocaleDateString("en-US", DATE_OPTIONS)
        ),

    // Items
    quantity: z.coerce
        .number()
        .gt(0, { message: "Must be a number greater than 0" }),
    unitPrice: z.coerce
        .number()
        .gt(0, { message: "Must be a number greater than 0" })
        .lte(Number.MAX_SAFE_INTEGER, { message: `Must be ≤ ${Number.MAX_SAFE_INTEGER}` }),

    // Strings
    string: z.string(),
    stringMin1: z.string().min(1, { message: "Must be at least 1 character" }),
    stringToNumber: z.coerce.number(),

    // Charges
    stringToNumberWithMax: z.coerce.number().max(1000000),

    stringOptional: z.string().optional(),

    nonNegativeNumber: z.coerce.number().nonnegative({
        message: "Must be a positive number",
    }),
    // ! This is unused
    numWithCommas: z.coerce
        .number()
        .nonnegative({
            message: "Must be a positive number",
        })
        .transform((value) => {
            return formatNumberWithCommas(value);
        }),
};

const CustomInputSchema = z.object({
    key: z.string(),
    value: z.string(),
});

const InvoiceSenderSchema = z.object({
    name: fieldValidators.name,
    city: fieldValidators.city,
    country: fieldValidators.country,
    email: fieldValidators.email,
    phone: z.array(fieldValidators.phone).default([""]),
    customInputs: z.array(CustomInputSchema).optional(),
});

const InvoiceReceiverSchema = z.object({
    name: fieldValidators.name,
    city: fieldValidators.city,
    country: fieldValidators.country,
    email: fieldValidators.email,
    phone: z.array(fieldValidators.phone).default([""]),
    customInputs: z.array(CustomInputSchema).optional(),
});

const ItemSchema = z.object({
    name: fieldValidators.stringMin1,
    description: fieldValidators.stringOptional,
    quantity: fieldValidators.quantity,
    unitPrice: fieldValidators.unitPrice,
    total: fieldValidators.stringToNumber,
    passengerName: fieldValidators.stringOptional,
    serviceType: fieldValidators.stringOptional,
    vatPercentage: fieldValidators.stringToNumber.optional(),
    vat: fieldValidators.stringToNumber.optional(),
    extraDeliverables: z.array(z.object({
        name: fieldValidators.stringOptional,
        rowName: fieldValidators.stringOptional, // Custom name/title for this extra deliverable row
        serviceType: fieldValidators.stringOptional,
        amount: fieldValidators.stringToNumber.optional(),
        vatPercentage: fieldValidators.stringToNumber.optional(),
        vat: fieldValidators.stringToNumber.optional(),
        showVat: z.boolean().optional(),
        showColumns: z.object({
            name: z.boolean().optional(),
            serviceType: z.boolean().optional(),
            amount: z.boolean().optional(),
            vatPercentage: z.boolean().optional(),
            vat: z.boolean().optional(),
        }).optional(),
    })).optional(),
    // Legacy fields for backward compatibility
    extraDeliverableEnabled: z.boolean().optional(),
    extraDeliverable: fieldValidators.stringOptional,
    extraDeliverableServiceType: fieldValidators.stringOptional,
    extraDeliverableAmount: fieldValidators.stringToNumber.optional(),
    extraDeliverableVatPercentage: fieldValidators.stringToNumber.optional(),
    extraDeliverableVat: fieldValidators.stringToNumber.optional(),
    extraDeliverableShowVat: z.boolean().optional(),
});

const PaymentInformationSchema = z.object({
    bankName: fieldValidators.stringMin1,
    accountName: fieldValidators.stringMin1,
    accountNumber: fieldValidators.stringMin1,
    iban: fieldValidators.stringOptional,
    swiftCode: fieldValidators.stringOptional,
});

const DiscountDetailsSchema = z.object({
    amount: fieldValidators.stringToNumberWithMax,
    amountType: fieldValidators.string,
});

const TaxDetailsSchema = z.object({
    amount: fieldValidators.stringToNumberWithMax,
    taxID: fieldValidators.string,
    amountType: fieldValidators.string,
});

const ShippingDetailsSchema = z.object({
    cost: fieldValidators.stringToNumberWithMax,
    costType: fieldValidators.string,
});

const SignatureSchema = z.object({
    data: fieldValidators.string,
    fontFamily: fieldValidators.string.optional(),
});

const InvoiceDetailsSchema = z.object({
    invoiceLogo: fieldValidators.stringOptional,
    invoiceNumber: fieldValidators.stringMin1,
    invoiceDate: fieldValidators.date,
    dueDate: fieldValidators.date.optional(),
    purchaseOrderNumber: fieldValidators.stringOptional,
    currency: fieldValidators.string,
    language: fieldValidators.string,
    numberOfPassengers: fieldValidators.quantity.optional(),
    items: z.array(ItemSchema),
    paymentInformation: z.union([
        PaymentInformationSchema,
        z.array(PaymentInformationSchema).max(4)
    ]).optional(),
    taxDetails: TaxDetailsSchema.optional(),
    discountDetails: DiscountDetailsSchema.optional(),
    shippingDetails: ShippingDetailsSchema.optional(),
    subTotal: fieldValidators.nonNegativeNumber,
    totalAmount: fieldValidators.nonNegativeNumber,
    totalAmountInWords: fieldValidators.string,
    additionalNotes: fieldValidators.stringOptional,
    paymentTerms: fieldValidators.stringOptional,
    signature: SignatureSchema.optional(),
    updatedAt: fieldValidators.stringOptional,
    pdfTemplate: z.number(),
    showVat: z.boolean().optional(),
    showPassengerName: z.boolean().optional(),
    showRoute: z.boolean().optional(),
    showAirlines: z.boolean().optional(),
    showServiceType: z.boolean().optional(),
    showAmount: z.boolean().optional(),
    columnNames: z.object({
        passengerName: z.string().optional(),
        route: z.string().optional(),
        airlines: z.string().optional(),
        serviceType: z.string().optional(),
        amount: z.string().optional(),
    }).optional(),
    extraDeliverableColumnNames: z.object({
        name: z.string().optional(),
        serviceType: z.string().optional(),
        amount: z.string().optional(),
        vatPercentage: z.string().optional(),
        vat: z.string().optional(),
    }).optional(),
    showExtraDeliverableColumns: z.object({
        name: z.boolean().optional(),
        serviceType: z.boolean().optional(),
        amount: z.boolean().optional(),
        vatPercentage: z.boolean().optional(),
        vat: z.boolean().optional(),
    }).optional(),
    showReceiverSignatureSection: z.boolean().optional(),
});

const InvoiceSchema = z.object({
    sender: InvoiceSenderSchema,
    receiver: InvoiceReceiverSchema,
    details: InvoiceDetailsSchema,
});

const ClientSchema = z.object({
    name: fieldValidators.name,
    email: fieldValidators.email,
    phone: fieldValidators.phone.optional(),
    city: fieldValidators.city.optional(),
    country: fieldValidators.country.optional(),
    address: fieldValidators.address.optional(),
    zipCode: fieldValidators.zipCode.optional(),
    notes: fieldValidators.stringOptional,
    tags: z.array(z.string()).optional(),
});

export { InvoiceSchema, ItemSchema, ClientSchema };
