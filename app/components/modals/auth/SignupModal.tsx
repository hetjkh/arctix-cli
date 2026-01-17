"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { BaseButton } from "@/app/components";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";

const signupSchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

type SignupModalProps = {
    children: React.ReactNode;
    onSuccess?: () => void;
};

const SignupModal = ({ children, onSuccess }: SignupModalProps) => {
    const [open, setOpen] = useState(false);
    const { signup } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        try {
            const result = await signup(data.email, data.password, data.name);
            if (result.success) {
                toast({
                    variant: "default",
                    title: "Account created",
                    description: "Welcome! You can now save your invoices.",
                });
                reset();
                setOpen(false);
                onSuccess?.();
            } else {
                toast({
                    variant: "destructive",
                    title: "Signup failed",
                    description: result.error || "Could not create account",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Account</DialogTitle>
                    <DialogDescription>
                        Sign up to save and access your invoices from anywhere
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name (Optional)</label>
                        <input
                            {...register("name")}
                            type="text"
                            className="w-full px-3 py-2 mt-1 border rounded-md"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            {...register("email")}
                            type="email"
                            className="w-full px-3 py-2 mt-1 border rounded-md"
                            placeholder="your@email.com"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <input
                            {...register("password")}
                            type="password"
                            className="w-full px-3 py-2 mt-1 border rounded-md"
                            placeholder="••••••"
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Confirm Password</label>
                        <input
                            {...register("confirmPassword")}
                            type="password"
                            className="w-full px-3 py-2 mt-1 border rounded-md"
                            placeholder="••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                    <BaseButton
                        type="submit"
                        className="w-full"
                        loading={isLoading}
                        loadingText="Creating account..."
                    >
                        <UserPlus className="w-4 h-4" />
                        Sign Up
                    </BaseButton>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SignupModal;

