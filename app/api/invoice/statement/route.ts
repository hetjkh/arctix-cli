export const maxDuration = 60;

import { NextRequest } from "next/server";

// Services
import { generateStatementService } from "@/services/invoice/server/generateStatementService";

export async function POST(req: NextRequest) {
    const result = await generateStatementService(req);
    return result;
}

