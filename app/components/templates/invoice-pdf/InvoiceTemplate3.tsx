import React from "react";

// Components
import { InvoiceLayout } from "@/app/components";

// Helpers
import { formatNumberWithCommas, formatNumberWithCommasNoDecimals, isDataUrl, isImageUrl } from "@/lib/helpers";
import { DATE_OPTIONS } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

const InvoiceTemplate = (data: InvoiceType) => {
  const { sender, receiver, details } = data;

  const itinerary = details.items || [];
  const showVat = details.showVat || false;
  
  // Column visibility flags (default to true if not set)
  const showPassengerName = details.showPassengerName !== false;
  const showRoute = details.showRoute !== false;
  const showAirlines = details.showAirlines !== false;
  const showServiceType = details.showServiceType !== false;
  const showAmount = details.showAmount !== false;
  
  // Column names (use custom names if available, otherwise defaults)
  const defaultColumnNames = {
    passengerName: "Passenger Name",
    route: "Route",
    airlines: "Airlines",
    serviceType: "Type of Service",
    amount: "Amount",
  };
  const columnNames = {
    ...defaultColumnNames,
    ...(details.columnNames || {}),
  };
  
  // Extra deliverable column names
  const defaultExtraDeliverableColumnNames = {
    name: "Extra Deliverable",
    serviceType: "Type of Service",
    amount: "Amount",
    vatPercentage: "VAT %",
    vat: "VAT Amount",
  };
  const extraDeliverableColumnNames = {
    ...defaultExtraDeliverableColumnNames,
    ...(details.extraDeliverableColumnNames || {}),
  };
  
  // Extra deliverable column visibility
  const defaultShowExtraDeliverableColumns = {
    name: true,
    serviceType: true,
    amount: true,
    vatPercentage: true,
    vat: true,
  };
  const showExtraDeliverableColumns = {
    ...defaultShowExtraDeliverableColumns,
    ...(details.showExtraDeliverableColumns || {}),
  };
  
  // Calculate visible column count for colspan
  const visibleColumnsCount = [
    showPassengerName,
    showRoute,
    showAirlines,
    showServiceType,
    showAmount,
  ].filter(Boolean).length;

  const renderMultiline = (value?: string) => {
    if (!value) return null;
    return value
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line, index) => (
        <p key={`${line}-${index}`} className="leading-tight break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {line}
        </p>
      ));
  };

  return (
    <InvoiceLayout data={data}>
      <div className="border border-gray-300 p-6 rounded-xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-6">
          <div className="max-w-xs space-y-2">
            {details.invoiceLogo && (
              <img
                src={details.invoiceLogo}
                width={120}
                height={68}
                alt={`Logo of ${sender.name}`}
              />
            )}
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-800">
              {sender.name}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                {sender.city}, {sender.country}
              </p>
              <p>{sender.email}</p>
              {sender.phone && (
                <>
                  {(Array.isArray(sender.phone) ? sender.phone : [sender.phone]).filter(phone => phone && phone.trim()).map((phone, index) => (
                    <p key={index}>{phone.trim()}</p>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="ml-auto text-right space-y-3">
            <h2 className="text-3xl font-semibold tracking-wide text-gray-900">
              Travel Invoice
            </h2>
            <div className="space-y-2.5">
              <p className="text-base">
                <span className="font-bold text-gray-900">Invoice #:</span>{" "}
                <span className="font-bold text-gray-900 text-lg">{details.invoiceNumber}</span>
              </p>
              <p className="text-base">
                <span className="font-bold text-gray-900">Date:</span>{" "}
                <span className="font-semibold text-gray-800">
                  {details.invoiceDate
                    ? new Date(details.invoiceDate).toLocaleDateString(
                        "en-US",
                        DATE_OPTIONS
                      )
                    : "-"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Billed To - Left Side */}
        <div className="flex justify-start">
          <div className="text-left space-y-2.5 min-w-[280px]">
            <p className="uppercase text-sm font-bold tracking-widest text-gray-900 border-b border-gray-400 pb-2">
              Billed To
            </p>
            <p className="font-bold text-base text-gray-900">{receiver.name}</p>
            <p className="text-sm font-medium text-gray-800">
              {receiver.city}, {receiver.country}
            </p>
            <p className="text-sm font-medium text-gray-800">{receiver.email}</p>
            {receiver.phone && (
              <>
                {(Array.isArray(receiver.phone) ? receiver.phone : [receiver.phone]).filter(phone => phone && phone.trim()).map((phone, index) => (
                  <p key={index} className="text-sm font-medium text-gray-800">{phone.trim()}</p>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Passenger & itinerary table */}
        <div className="overflow-hidden rounded-lg border border-gray-400">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-100 text-gray-800 uppercase text-xs tracking-widest">
              <tr>
                {showPassengerName && (
                  <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '18%' }}>
                    {columnNames.passengerName}
                  </th>
                )}
                {showRoute && (
                  <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '32%' }}>
                    {columnNames.route}
                  </th>
                )}
                {showAirlines && (
                  <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '18%' }}>
                    {columnNames.airlines}
                  </th>
                )}
                {showServiceType && (
                  <th className="border border-gray-400 px-4 py-3 text-left" style={{ width: '17%' }}>
                    {columnNames.serviceType}
                  </th>
                )}
                {showAmount && (
                  <th className="border border-gray-400 px-4 py-3 text-right" style={{ width: '15%' }}>
                    {columnNames.amount}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {itinerary.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumnsCount}
                    className="border border-gray-400 px-4 py-6 text-center italic text-gray-500"
                  >
                    No travel segments provided.
                  </td>
                </tr>
              ) : (
                itinerary.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr className="align-top">
                      {showPassengerName && (
                        <td className="border border-gray-400 px-4 py-4 font-semibold text-gray-900" style={{ wordBreak: 'normal', overflowWrap: 'normal' }}>
                          {item.passengerName || `Passenger ${index + 1}`}
                        </td>
                      )}
                      {showRoute && (
                        <td className="border border-gray-400 px-4 py-4 space-y-1 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {renderMultiline(item.description)}
                          {!item.description && (
                            <p className="italic text-gray-400">
                              Add travel details in the item description field.
                            </p>
                          )}
                        </td>
                      )}
                      {showAirlines && (
                        <td className="border border-gray-400 px-4 py-4 space-y-1 break-words">
                          {renderMultiline(item.name)}
                          {!item.name && (
                            <p className="italic text-gray-400">
                              Specify airline names in the item title.
                            </p>
                          )}
                        </td>
                      )}
                      {showServiceType && (
                        <td className="border border-gray-400 px-4 py-4 text-gray-700 break-words">
                          {item.serviceType || "-"}
                        </td>
                      )}
                      {showAmount && (
                        <td className="border border-gray-400 px-4 py-4 text-right font-medium">
                          {formatNumberWithCommasNoDecimals(Number(item.unitPrice) || 0)}{" "}
                          {details.currency}
                        </td>
                      )}
                    </tr>
                    {/* Render extra deliverables array */}
                    {item.extraDeliverables && Array.isArray(item.extraDeliverables) && item.extraDeliverables.length > 0 && (
                      <>
                        {item.extraDeliverables.map((extra, extraIndex) => {
                          // Get per-deliverable column visibility, defaulting to all true if not set
                          const defaultShowColumns = {
                            name: true,
                            serviceType: true,
                            amount: true,
                            vatPercentage: true,
                            vat: true,
                          };
                          const showColumns = extra?.showColumns || defaultShowColumns;
                          
                          // Show the row if it has any meaningful data
                          // Check for amount as number (not just truthy, since 0 is valid)
                          const hasAmount = extra?.amount !== undefined && extra?.amount !== null;
                          const hasName = extra?.name && extra.name.trim() !== "";
                          const hasRowName = extra?.rowName && extra.rowName.trim() !== "";
                          const hasServiceType = extra?.serviceType && extra.serviceType.trim() !== "";
                          const hasVatPercentage = extra?.vatPercentage !== undefined && extra?.vatPercentage !== null;
                          const hasData = hasAmount || hasName || hasRowName || hasServiceType || hasVatPercentage;
                          
                          // Always show if there's any data, even if amount is 0
                          if (!hasData) return null;
                          
                          return (
                            <tr key={extraIndex} className="align-top">
                              {showPassengerName && (
                                <td className="border border-gray-400 px-4 py-4 font-semibold text-gray-900">
                                  {extra.rowName || ""}
                                </td>
                              )}
                              {showRoute && (
                                <td className="border border-gray-400 px-4 py-4 text-gray-700 break-words">
                                  {showColumns.name ? (extra.name || "") : ""}
                                </td>
                              )}
                              {showAirlines && <td className="border border-gray-400 px-4 py-4"></td>}
                              {showServiceType && (
                                <td className="border border-gray-400 px-4 py-4 text-gray-700 break-words">
                                  {showColumns.serviceType ? (extra.serviceType || "-") : "-"}
                                </td>
                              )}
                              {showAmount && (
                                <td className="border border-gray-400 px-4 py-4 text-right font-medium">
                                  {showColumns.amount && (extra.amount !== undefined && extra.amount !== null)
                                    ? `${formatNumberWithCommasNoDecimals(Number(extra.amount) || 0)} ${details.currency}`
                                    : ""}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        {/* Legacy support for old single extraDeliverable structure */}
                        {item.extraDeliverableEnabled && !item.extraDeliverables && (
                          <>
                            <tr className="align-top">
                              {showPassengerName && <td className="border border-gray-400 px-4 py-4"></td>}
                              {showRoute && (
                                <td className="border border-gray-400 px-4 py-4 text-gray-700 break-words">
                                  {item.extraDeliverable || ""}
                                </td>
                              )}
                              {showAirlines && <td className="border border-gray-400 px-4 py-4"></td>}
                              {showServiceType && (
                                <td className="border border-gray-400 px-4 py-4 text-gray-700 break-words">
                                  {item.extraDeliverableServiceType || "-"}
                                </td>
                              )}
                              {showAmount && (
                                <td className="border border-gray-400 px-4 py-4 text-right font-medium">
                                  {item.extraDeliverableAmount 
                                    ? `${formatNumberWithCommas(Number(item.extraDeliverableAmount) || 0)} ${details.currency}`
                                    : ""}
                                </td>
                              )}
                            </tr>
                            {item.extraDeliverableShowVat && item.extraDeliverableVat !== undefined && Number(item.extraDeliverableVat) > 0 && (
                              <tr className="align-top">
                                <td className="border border-gray-400 px-4 py-2 text-gray-700" colSpan={visibleColumnsCount - 1}>
                                  <span className="font-medium">
                                    Extra Deliverable VAT{item.extraDeliverableVatPercentage ? ` = ${item.extraDeliverableVatPercentage}%` : ''}
                                  </span>
                                </td>
                                {showAmount && (
                                  <td className="border border-gray-400 px-4 py-2 text-right font-medium">
                                    {formatNumberWithCommas(Number(item.extraDeliverableVat) || 0)}{" "}
                                    {details.currency}
                                  </td>
                                )}
                              </tr>
                            )}
                          </>
                        )}
                      </>
                    )}
                    {/* Show merged VAT row (main VAT + all extra deliverable VATs) */}
                    {(() => {
                      // Calculate main item VAT
                      const mainVat = item.vat !== undefined && Number(item.vat) > 0 ? Number(item.vat) : 0;
                      
                      // Calculate total VAT from all extra deliverables that have showVat enabled
                      let totalExtraVat = 0;
                      
                      if (item.extraDeliverables && Array.isArray(item.extraDeliverables)) {
                        item.extraDeliverables.forEach((extra) => {
                          if (extra?.showVat && extra?.vat !== undefined && extra?.vat !== null && Number(extra.vat) > 0) {
                            totalExtraVat += Number(extra.vat) || 0;
                          }
                        });
                      }
                      
                      // Calculate merged VAT total
                      const mergedVatTotal = mainVat + totalExtraVat;
                      
                      // Show single merged VAT row only if showVat toggle is ON and there's VAT to display
                      if (showVat && mergedVatTotal > 0) {
                        return (
                          <tr className="align-top">
                            <td className="border border-gray-400 px-4 py-2 text-gray-700" colSpan={visibleColumnsCount - 1}>
                              <span className="font-medium">
                                VAT
                              </span>
                            </td>
                            {showAmount && (
                              <td className="border border-gray-400 px-4 py-2 text-right font-medium">
                                {formatNumberWithCommas(mergedVatTotal)}{" "}
                                {details.currency}
                              </td>
                            )}
                          </tr>
                        );
                      }
                      return null;
                    })()}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3 text-sm text-gray-700">
            {details.additionalNotes && (
              <div>
                <p className="uppercase text-xs font-semibold tracking-widest text-gray-500">
                  Notes
                </p>
                <p className="whitespace-pre-line">{details.additionalNotes}</p>
              </div>
            )}
            {details.paymentTerms && (
              <div>
                <p className="uppercase text-xs font-semibold tracking-widest text-gray-500">
                  Payment Terms
                </p>
                <p className="whitespace-pre-line">{details.paymentTerms}</p>
              </div>
            )}
          </div>

          <div className="border border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-700">
              <span className="font-semibold">Subtotal</span>
              <span>
                {formatNumberWithCommas(Number(details.subTotal) || 0)}{" "}
                {details.currency}
              </span>
            </div>
            {details.discountDetails?.amount ? (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Discount</span>
                <span>
                  {details.discountDetails.amountType === "amount"
                    ? `- ${formatNumberWithCommas(
                        Number(details.discountDetails.amount) || 0
                      )} ${details.currency}`
                    : `- ${details.discountDetails.amount}%`}
                </span>
              </div>
            ) : null}
            {details.taxDetails?.amount ? (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Tax</span>
                <span>
                  {details.taxDetails.amountType === "amount"
                    ? `+ ${formatNumberWithCommas(
                        Number(details.taxDetails.amount) || 0
                      )} ${details.currency}`
                    : `+ ${details.taxDetails.amount}%`}
                </span>
              </div>
            ) : null}
            {details.shippingDetails?.cost ? (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Service Fees</span>
                <span>
                  {details.shippingDetails.costType === "amount"
                    ? `+ ${formatNumberWithCommas(
                        Number(details.shippingDetails.cost) || 0
                      )} ${details.currency}`
                    : `+ ${details.shippingDetails.cost}%`}
                </span>
              </div>
            ) : null}
            <div className="border-t border-gray-300 pt-3 flex justify-between text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>
                {formatNumberWithCommas(Number(details.totalAmount) || 0)}{" "}
                {details.currency}
              </span>
            </div>
            {details.totalAmountInWords && (
              <p className="text-xs text-gray-600 italic">
                Amount in words: {details.totalAmountInWords}{" "}
                {details.currency}
              </p>
            )}
          </div>
        </div>

        {/* Payment details and Signature */}
        <div className="mt-3">
          <div className="flex justify-between items-start gap-3">
            {details.paymentInformation && (
              <div className="flex flex-col" style={{ maxWidth: '400px' }}>
                <div className="rounded border border-gray-300 overflow-hidden">
                  {(Array.isArray(details.paymentInformation) 
                    ? details.paymentInformation.slice(0, 4) 
                    : [details.paymentInformation]
                  ).map((paymentInfo, index, array) => (
                    <div key={index} className={index < array.length - 1 ? "border-b border-gray-300" : ""}>
                      <div className="p-1.5 text-xs text-gray-700">
                        <p className="uppercase text-[10px] font-semibold tracking-wider text-gray-500 mb-0.5">
                          Payment Instructions{array.length > 1 ? ` ${index + 1}` : ''}
                        </p>
                        <p className="mb-0 leading-tight">Bank: {paymentInfo.bankName}</p>
                        <p className="mb-0 leading-tight">Account Name: {paymentInfo.accountName}</p>
                        <p className="mb-0 leading-tight">Account Number: {paymentInfo.accountNumber}</p>
                        {paymentInfo.iban && (
                          <p className="mb-0 leading-tight">IBAN No: {paymentInfo.iban}</p>
                        )}
                        {paymentInfo.swiftCode && (
                          <p className="mb-0 leading-tight">SWIFT Code: {paymentInfo.swiftCode}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature */}
            {details.signature?.data && (
              <div className="flex-shrink-0 ml-auto">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-0.5">
                  Authorized Signature
                </p>
                {isImageUrl(details.signature.data) ? (
                  <img
                    src={details.signature.data}
                    width={100}
                    height={50}
                    alt={`Signature of ${sender.name}`}
                  />
                ) : (
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 400,
                      fontFamily: `${details.signature.fontFamily}, cursive`,
                      margin: 0,
                    }}
                  >
                    {details.signature.data}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-0.5">{sender.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </InvoiceLayout>
  );
};

export default InvoiceTemplate;

