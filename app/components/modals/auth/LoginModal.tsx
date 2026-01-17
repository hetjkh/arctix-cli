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
import { FormInput } from "@/app/components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { toast } from "@/components/ui/use-toast";
import { LogIn } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginModalProps = {
    children: React.ReactNode;
    onSuccess?: () => void;
};

const LoginModal = ({ children, onSuccess }: LoginModalProps) => {
    const [open, setOpen] = useState(false);
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const result = await login(data.email, data.password);
            if (result.success) {
                toast({
                    variant: "default",
                    title: "Login successful",
                    description: "Welcome back!",
                });
                reset();
                setOpen(false);
                onSuccess?.();
            } else {
                toast({
                    variant: "destructive",
                    title: "Login failed",
                    description: result.error || "Invalid credentials",
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
                    <DialogTitle>Login</DialogTitle>
                    <DialogDescription>
                        Enter your credentials to access your invoices
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <BaseButton
                        type="submit"
                        className="w-full"
                        loading={isLoading}
                        loadingText="Logging in..."
                    >
                        <LogIn className="w-4 h-4" />
                        Login
                    </BaseButton>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default LoginModal;

