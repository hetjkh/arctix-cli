"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// ShadCn components
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

// Components
import { BaseButton } from "@/app/components";

// Icons
import { ImageMinus, Image } from "lucide-react";

// Types
import { NameType } from "@/types";

type FormFileProps = {
    name: NameType;
    label?: string;
    placeholder?: string;
};

const FormFile = ({ name, label, placeholder }: FormFileProps) => {
    const { control, setValue } = useFormContext();

    const logoImage = useWatch({
        name: name,
        control,
    });

    const [base64Image, setBase64Image] = useState<string>(logoImage ?? "");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Sync state with form value changes
    useEffect(() => {
        setBase64Image(logoImage ?? "");
    }, [logoImage]);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files![0];
        if (file) {
            setUploading(true);
            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64String = event.target!.result as string;
                    setBase64Image(base64String);
                    
                    // Upload to Cloudinary
                    try {
                        const response = await fetch("/api/upload/cloudinary", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                base64String,
                                folder: "invoify/logos",
                            }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            setBase64Image(data.url);
                            setValue(name, data.url); // Set Cloudinary URL
                        } else {
                            // Fallback to base64 if upload fails
                            setValue(name, base64String);
                        }
                    } catch (error) {
                        console.error("Upload error:", error);
                        // Fallback to base64 if upload fails
                        setValue(name, base64String);
                    } finally {
                        setUploading(false);
                    }
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("File read error:", error);
                setUploading(false);
            }
        }
    };

    const removeLogo = () => {
        setBase64Image("");
        setValue(name, "");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem>
                        <Label>{label}:</Label>
                        {uploading ? (
                            <div className="flex items-center justify-center h-[7rem] w-[10rem]">
                                <p>Uploading...</p>
                            </div>
                        ) : (base64Image && base64Image.trim() !== "") || (field.value && field.value.trim() !== "") ? (
                            <img
                                id="logoImage"
                                src={base64Image || field.value}
                                style={{
                                    objectFit: "contain",
                                    width: "10rem",
                                    height: "7rem",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    objectFit: "contain",
                                    width: "10rem",
                                    height: "7rem",
                                }}
                            >
                                <Label
                                    htmlFor={name}
                                    className="flex justify-center items-center h-[7rem] w-[10rem] cursor-pointer rounded-md bg-gray-100 dark:bg-slate-800 border border-black dark:border-white hover:border-blue-500"
                                >
                                    <>
                                        <div className="flex flex-col items-center">
                                            <Image />
                                            <p>{placeholder}</p>
                                        </div>
                                        <FormControl>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                id={name}
                                                className="hidden"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </>
                                </Label>
                            </div>
                        )}
                    </FormItem>
                )}
            />
            {base64Image && base64Image.trim() !== "" && (
                <div>
                    <BaseButton variant="destructive" onClick={removeLogo}>
                        <ImageMinus />
                        Remove logo
                    </BaseButton>
                </div>
            )}
        </>
    );
};

export default FormFile;
