import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UserDefaults } from "@/models/UserDefaults";
import { ObjectId } from "mongodb";

/**
 * GET /api/user/defaults
 * Get all user's default presets or a specific preset by ID
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

        const { searchParams } = new URL(req.url);
        const presetId = searchParams.get("id");

        const db = await getDb();
        const defaultsCollection = db.collection<UserDefaults>("userDefaults");

        if (presetId) {
            // Get specific preset
            const preset = await defaultsCollection.findOne({
                _id: new ObjectId(presetId),
                userId: new ObjectId(currentUser.userId),
            });

            if (!preset) {
                return NextResponse.json(
                    { error: "Preset not found" },
                    { status: 404 }
                );
            }

            const { _id, userId, ...presetData } = preset;
            return NextResponse.json(
                { preset: { ...presetData, id: _id?.toString() } },
                { status: 200 }
            );
        } else {
            // Get all presets for user
            const presets = await defaultsCollection
                .find({
                    userId: new ObjectId(currentUser.userId),
                })
                .sort({ createdAt: -1 })
                .toArray();

            const presetsData = presets.map((preset) => {
                const { _id, userId, ...presetData } = preset;
                return { ...presetData, id: _id?.toString() };
            });

            return NextResponse.json(
                { presets: presetsData },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error("Error fetching user defaults:", error);
        return NextResponse.json(
            { error: "Failed to fetch user defaults" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/defaults
 * Create a new default preset
 */
export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        
        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, sender, receiver, details } = body;

        // Validate required fields
        if (!name || !sender || !receiver || !details) {
            return NextResponse.json(
                { error: "Missing required fields: name, sender, receiver, or details" },
                { status: 400 }
            );
        }

        // Remove items from details if present (shouldn't be saved as default)
        const { items, ...detailsWithoutItems } = details;

        const db = await getDb();
        const defaultsCollection = db.collection<UserDefaults>("userDefaults");

        const userId = new ObjectId(currentUser.userId);

        // Check if preset name already exists for this user
        const existingPreset = await defaultsCollection.findOne({
            userId,
            name: name.trim(),
        });

        if (existingPreset) {
            return NextResponse.json(
                { error: "A preset with this name already exists" },
                { status: 400 }
            );
        }

        const defaultsData: Omit<UserDefaults, "_id"> = {
            userId,
            name: name.trim(),
            sender,
            receiver,
            details: detailsWithoutItems,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await defaultsCollection.insertOne(defaultsData as UserDefaults);

        // Remove userId from response
        const { userId: _, ...responseDefaults } = defaultsData;

        return NextResponse.json(
            {
                message: "Preset saved successfully",
                preset: { ...responseDefaults, id: result.insertedId.toString() },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error saving user defaults:", error);
        return NextResponse.json(
            { error: "Failed to save user defaults" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/defaults
 * Update an existing preset
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
        const { id, name, sender, receiver, details } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Preset ID is required" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const defaultsCollection = db.collection<UserDefaults>("userDefaults");

        const userId = new ObjectId(currentUser.userId);
        const presetId = new ObjectId(id);

        // Verify preset belongs to user
        const existingPreset = await defaultsCollection.findOne({
            _id: presetId,
            userId,
        });

        if (!existingPreset) {
            return NextResponse.json(
                { error: "Preset not found" },
                { status: 404 }
            );
        }

        // If name is being changed, check for duplicates
        if (name && name.trim() !== existingPreset.name) {
            const duplicatePreset = await defaultsCollection.findOne({
                userId,
                name: name.trim(),
                _id: { $ne: presetId },
            });

            if (duplicatePreset) {
                return NextResponse.json(
                    { error: "A preset with this name already exists" },
                    { status: 400 }
                );
            }
        }

        // Remove items from details if present
        const { items, ...detailsWithoutItems } = details || {};

        const updateData: Partial<UserDefaults> = {
            updatedAt: new Date(),
        };

        if (name) updateData.name = name.trim();
        if (sender) updateData.sender = sender;
        if (receiver) updateData.receiver = receiver;
        if (details) updateData.details = detailsWithoutItems;

        await defaultsCollection.updateOne(
            { _id: presetId, userId },
            { $set: updateData }
        );

        return NextResponse.json(
            { message: "Preset updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating user defaults:", error);
        return NextResponse.json(
            { error: "Failed to update user defaults" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/user/defaults
 * Delete a preset
 */
export async function DELETE(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        
        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const presetId = searchParams.get("id");

        if (!presetId) {
            return NextResponse.json(
                { error: "Preset ID is required" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const defaultsCollection = db.collection<UserDefaults>("userDefaults");

        const userId = new ObjectId(currentUser.userId);
        const id = new ObjectId(presetId);

        const result = await defaultsCollection.deleteOne({
            _id: id,
            userId,
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: "Preset not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Preset deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting user defaults:", error);
        return NextResponse.json(
            { error: "Failed to delete user defaults" },
            { status: 500 }
        );
    }
}

