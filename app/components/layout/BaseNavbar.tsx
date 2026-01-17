"use client";

// Next
import Link from "next/link";
import Image from "next/image";

// Assets
import Logo from "@/public/assets/img/Arctic Base FavIcon.png";

// ShadCn
import { Card } from "@/components/ui/card";

// Components
import { LanguageSelector, ThemeSwitcher, LoginModal, SignupModal, BaseButton } from "@/app/components";

// Contexts
import { useAuth } from "@/contexts/AuthContext";
import { useInvoiceSettings } from "@/contexts/InvoiceSettingsContext";

// Icons
import { LogOut, User, Users, Settings } from "lucide-react";

const BaseNavbar = () => {
    const { user, logout } = useAuth();
    
    // Try to get settings context, but handle if not available (e.g., on non-invoice pages)
    let openSettings: (() => void) | null = null;
    try {
        const settings = useInvoiceSettings();
        openSettings = settings.openSettings;
    } catch {
        // Settings context not available, button won't work but won't crash
    }

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className="z-[99]">
            <nav>
                <Card className="flex flex-wrap justify-between items-center px-5 gap-5">
                    <Link href={"/"} className="flex items-center gap-3">
                        <Image
                            src={Logo}
                            alt="Arnivoice Logo"
                            width={120}
                            height={60}
                            loading="eager"
                                className="w-28 h-auto object-contain dark:invert"
                            />
                            <span className="text-3xl font-semibold tracking-wide">
                            Arcticx
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {openSettings && (
                            <BaseButton
                                variant="ghost"
                                size="sm"
                                onClick={openSettings}
                                tooltipLabel="Invoice Settings"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </BaseButton>
                        )}
                        {user && (
                            <Link href="/clients">
                                <BaseButton variant="ghost" size="sm" tooltipLabel="Clients">
                                    <Users className="w-4 h-4 mr-2" />
                                    Clients
                                </BaseButton>
                            </Link>
                        )}
                        <LanguageSelector />
                        <ThemeSwitcher />
                        {user ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.email}
                                </span>
                                <BaseButton
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogout}
                                    tooltipLabel="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </BaseButton>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <LoginModal>
                                    <BaseButton variant="outline" size="sm">
                                        Login
                                    </BaseButton>
                                </LoginModal>
                                <SignupModal>
                                    <BaseButton variant="default" size="sm">
                                        Sign Up
                                    </BaseButton>
                                </SignupModal>
                            </div>
                        )}
                    </div>
                </Card>
            </nav>
        </header>
    );
};

export default BaseNavbar;
