import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UserPreferences } from "@/models/UserPreferences";
import { ObjectId } from "mongodb";

/**
 * GET /api/user/preferences
 * Get user preferences (column names)
 */
export async function GET(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        
        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const db = await getDb();
        const preferencesCollection = db.collection<UserPreferences>("userPreferences");

        const userId = new ObjectId(currentUser.userId);
        const preferences = await preferencesCollection.findOne({ userId });

        if (!preferences) {
            // Return default column names if no preferences exist
            return NextResponse.json(
                { 
                    columnNames: {
                        passengerName: "Passenger Name",
                        route: "Route",
                        airlines: "Airlines",
                        serviceType: "Type of Service",
                        amount: "Amount",
                    },
                    extraDeliverableColumnNames: {
                        name: "Extra Deliverable",
                        serviceType: "Type of Service",
                        amount: "Amount",
                        vatPercentage: "VAT %",
                        vat: "VAT Amount",
                    },
                    showExtraDeliverableColumns: {
                        name: true,
                        serviceType: true,
                        amount: true,
                        vatPercentage: true,
                        vat: true,
                    },
                },
                { status: 200 }
            );
        }

        // Merge with defaults to ensure all fields exist
        const defaultColumnNames = {
            passengerName: "Passenger Name",
            route: "Route",
            airlines: "Airlines",
            serviceType: "Type of Service",
            amount: "Amount",
        };

        const defaultExtraDeliverableColumnNames = {
            name: "Extra Deliverable",
            serviceType: "Type of Service",
            amount: "Amount",
            vatPercentage: "VAT %",
            vat: "VAT Amount",
        };

        const defaultShowExtraDeliverableColumns = {
            name: true,
            serviceType: true,
            amount: true,
            vatPercentage: true,
            vat: true,
        };

        const columnNames = {
            ...defaultColumnNames,
            ...(preferences.columnNames || {}),
        };

        const extraDeliverableColumnNames = {
            ...defaultExtraDeliverableColumnNames,
            ...(preferences.extraDeliverableColumnNames || {}),
        };

        const showExtraDeliverableColumns = {
            ...defaultShowExtraDeliverableColumns,
            ...(preferences.showExtraDeliverableColumns || {}),
        };

        return NextResponse.json(
            { 
                columnNames,
                extraDeliverableColumnNames,
                showExtraDeliverableColumns,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch user preferences" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/preferences
 * Update user preferences (column names)
 */
export async function PUT(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        
        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { columnNames, extraDeliverableColumnNames, showExtraDeliverableColumns } = body;

        if (!columnNames || typeof columnNames !== "object") {
            return NextResponse.json(
                { error: "Column names are required" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const preferencesCollection = db.collection<UserPreferences>("userPreferences");

        const userId = new ObjectId(currentUser.userId);

        // Check if preferences exist
        const existingPreferences = await preferencesCollection.findOne({ userId });

        if (existingPreferences) {
            // Update existing preferences
            await preferencesCollection.updateOne(
                { userId },
                {
                    $set: {
                        columnNames,
                        extraDeliverableColumnNames,
                        showExtraDeliverableColumns,
                        updatedAt: new Date(),
                    },
                }
            );
        } else {
            // Create new preferences
            const preferencesData: Omit<UserPreferences, "_id"> = {
                userId,
                columnNames,
                extraDeliverableColumnNames,
                showExtraDeliverableColumns,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await preferencesCollection.insertOne(preferencesData as UserPreferences);
        }

        return NextResponse.json(
            { 
                message: "Preferences saved successfully", 
                columnNames,
                extraDeliverableColumnNames,
                showExtraDeliverableColumns,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error saving user preferences:", error);
        return NextResponse.json(
            { error: "Failed to save user preferences" },
            { status: 500 }
        );
    }
}

