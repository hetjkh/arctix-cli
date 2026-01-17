import { NextRequest, NextResponse } from "next/server";

// Chromium
import chromium from "@sparticuz/chromium";

// Components
import StatementTemplate from "@/app/components/templates/invoice-pdf/StatementTemplate";

// Variables
import { ENV, TAILWIND_CDN } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

type StatementRequest = {
    invoices: InvoiceType[];
    title?: string;
    billedToName?: string;
};

/**
 * Generate a PDF statement document based on multiple invoices.
 *
 * @async
 * @param {NextRequest} req - The Next.js request object.
 * @throws {Error} If there is an error during the PDF generation process.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object containing the generated PDF.
 */
export async function generateStatementService(req: NextRequest) {
    const body: StatementRequest = await req.json();
    const { invoices, title, billedToName } = body;
    let browser;
    let page;

    if (!invoices || invoices.length === 0) {
        return new NextResponse(
            JSON.stringify({ error: "No invoices provided" }),
            {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }

    try {
        const ReactDOMServer = (await import("react-dom/server")).default;
        const htmlTemplate = ReactDOMServer.renderToStaticMarkup(
            StatementTemplate({ invoices, title, billedToName })
        );

        if (ENV === "production") {
            const puppeteer = (await import("puppeteer-core")).default;
            browser = await puppeteer.launch({
                args: [...chromium.args, "--disable-dev-shm-usage", "--ignore-certificate-errors"],
                executablePath: await chromium.executablePath(),
                headless: true,
            });
        } else {
            const puppeteer = (await import("puppeteer")).default;
            browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
                headless: true,
            });
        }

        if (!browser) {
            throw new Error("Failed to launch browser");
        }

        page = await browser.newPage();
        await page.setContent(htmlTemplate, {
            waitUntil: ["networkidle0", "load", "domcontentloaded"],
            timeout: 30000,
        });

        await page.addStyleTag({
            url: TAILWIND_CDN,
        });

        const pdf: Uint8Array = await page.pdf({
            format: "a4",
            printBackground: true,
            preferCSSPageSize: true,
        });

        return new NextResponse(new Blob([pdf], { type: "application/pdf" }), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "attachment; filename=statement.pdf",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
            status: 200,
        });
    } catch (error: any) {
        console.error("Statement PDF Generation Error:", error);
        return new NextResponse(
            JSON.stringify({ error: "Failed to generate statement PDF" }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {
                console.error("Error closing page:", e);
            }
        }
        if (browser) {
            try {
                const pages = await browser.pages();
                await Promise.all(pages.map((p) => p.close()));
                await browser.close();
            } catch (e) {
                console.error("Error closing browser:", e);
            }
        }
    }
}

