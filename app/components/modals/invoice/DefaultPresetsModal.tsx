"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useAuth } from "@/contexts/AuthContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Save, Trash2, Loader2, FolderOpen } from "lucide-react";

// Types
import { InvoiceType } from "@/types";

interface Preset {
    id: string;
    name: string;
    sender: InvoiceType["sender"];
    receiver: InvoiceType["receiver"];
    details: Omit<InvoiceType["details"], "items">;
    createdAt: string;
    updatedAt: string;
}

const DefaultPresetsModal = () => {
    const { user } = useAuth();
    const { _t } = useTranslationContext();
    const { getValues, reset } = useFormContext<InvoiceType>();
    const [open, setOpen] = useState(false);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [presetName, setPresetName] = useState("");
    const [showSaveForm, setShowSaveForm] = useState(false);

    // Load presets when modal opens
    useEffect(() => {
        if (open && user) {
            loadPresets();
        }
    }, [open, user]);

    const loadPresets = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/user/defaults");
            if (response.ok) {
                const data = await response.json();
                setPresets(data.presets || []);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load presets",
                });
            }
        } catch (error) {
            console.error("Error loading presets:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load presets",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreset = async () => {
        if (!presetName.trim()) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please enter a preset name",
            });
            return;
        }

        setSaving(true);
        try {
            const formValues = getValues();
            const { items, ...detailsWithoutItems } = formValues.details;

            const response = await fetch("/api/user/defaults", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: presetName.trim(),
                    sender: formValues.sender,
                    receiver: formValues.receiver,
                    details: detailsWithoutItems,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Success",
                    description: "Preset saved successfully",
                });
                setPresetName("");
                setShowSaveForm(false);
                loadPresets();
            } else {
                const error = await response.json();
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.error || "Failed to save preset",
                });
            }
        } catch (error) {
            console.error("Error saving preset:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save preset",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLoadPreset = async (presetId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/user/defaults?id=${presetId}`);
            if (response.ok) {
                const data = await response.json();
                const preset = data.preset;

                // Parse dates if they exist
                const detailsWithDates = { ...preset.details };
                if (detailsWithDates.invoiceDate) {
                    detailsWithDates.invoiceDate = new Date(detailsWithDates.invoiceDate);
                }
                if (detailsWithDates.dueDate) {
                    detailsWithDates.dueDate = new Date(detailsWithDates.dueDate);
                } else {
                    delete detailsWithDates.dueDate;
                }

                // Merge preset with form defaults, ensuring items are from FORM_DEFAULT_VALUES
                const mergedPreset: InvoiceType = {
                    sender: preset.sender,
                    receiver: preset.receiver,
                    details: {
                        ...detailsWithDates,
                        items: [
                            {
                                name: "",
                                description: "",
                                quantity: 0,
                                unitPrice: 0,
                                total: 0,
                                passengerName: "",
                                serviceType: "",
                            },
                        ],
                    },
                };

                reset(mergedPreset);
                setOpen(false);
                toast({
                    title: "Success",
                    description: `Preset "${preset.name}" loaded successfully`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load preset",
                });
            }
        } catch (error) {
            console.error("Error loading preset:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load preset",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePreset = async (presetId: string) => {
        if (!confirm("Are you sure you want to delete this preset?")) {
            return;
        }

        try {
            const response = await fetch(`/api/user/defaults?id=${presetId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Preset deleted successfully",
                });
                loadPresets();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to delete preset",
                });
            }
        } catch (error) {
            console.error("Error deleting preset:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete preset",
            });
        }
    };

    if (!user) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <BaseButton
                    variant="outline"
                    tooltipLabel="Manage default presets"
                >
                    <FolderOpen />
                    {_t("actions.managePresets")}
                </BaseButton>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{_t("actions.presets.title")}</DialogTitle>
                    <DialogDescription>
                        {_t("actions.presets.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Save new preset form */}
                    {showSaveForm ? (
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div>
                                <Label htmlFor="presetName">
                                    {_t("actions.presets.presetName")}
                                </Label>
                                <Input
                                    id="presetName"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    placeholder={_t("actions.presets.presetNamePlaceholder")}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSavePreset}
                                    disabled={saving || !presetName.trim()}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {_t("actions.presets.saving")}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {_t("actions.presets.save")}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowSaveForm(false);
                                        setPresetName("");
                                    }}
                                >
                                    {_t("actions.presets.cancel")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setShowSaveForm(true)}
                            className="w-full"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {_t("actions.presets.saveCurrent")}
                        </Button>
                    )}

                    {/* Presets list */}
                    <div className="space-y-2">
                        <h3 className="font-semibold">
                            {_t("actions.presets.savedPresets")} ({presets.length})
                        </h3>
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : presets.length === 0 ? (
                            <p className="text-muted-foreground text-center p-4">
                                {_t("actions.presets.noPresets")}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {presets.map((preset) => (
                                    <div
                                        key={preset.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                {preset.name}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(
                                                    preset.updatedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleLoadPreset(preset.id)
                                                }
                                            >
                                                <FolderOpen className="mr-2 h-4 w-4" />
                                                {_t("actions.presets.load")}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeletePreset(preset.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DefaultPresetsModal;

