"use client"

import { useRef } from 'react';
import { BaseButton } from '@/app/components';
import { useInvoiceContext } from '@/contexts/InvoiceContext';
import { Import } from 'lucide-react';

type ImportJsonButtonType = {
    setOpen: (open: boolean) => void;
}

const ImportJsonButton = ({ setOpen }: ImportJsonButtonType) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { importInvoice, invoicePdfLoading } = useInvoiceContext();

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();
            
            // Accept both JSON and Excel files
            if (
                fileType === 'application/json' || 
                fileName.endsWith('.json') ||
                fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                fileType === 'application/vnd.ms-excel' ||
                fileName.endsWith('.xlsx') ||
                fileName.endsWith('.xls')
            ) {
                await importInvoice(file);
                setOpen(false);
            }
        }
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.xlsx,.xls"
                style={{ display: 'none' }}
            />
            <BaseButton
                variant="outline"
                tooltipLabel="Import invoice (JSON or Excel)"
                disabled={invoicePdfLoading}
                onClick={handleClick}
            >
                <Import />
                Import Invoice
            </BaseButton>
        </>
    );
};

export default ImportJsonButton;