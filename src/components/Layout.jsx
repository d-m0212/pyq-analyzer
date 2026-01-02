import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, BookOpen, Settings, LogOut } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ASMRStaticBackground from "@/components/ui/demo";

export function Layout() {
    const [open, setOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const links = [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: (
                <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Settings",
            href: "#",
            onClick: () => setShowSettings(true),
            icon: (
                <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Logout",
            href: "#",
            onClick: () => {
                localStorage.clear();
                window.location.href = '/';
            },
            icon: (
                <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
    ];

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Ambient Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <ASMRStaticBackground />
            </div>

            {/* Sidebar Layout */}
            <div
                className={cn(
                    "relative z-10 flex flex-col md:flex-row w-full h-full mx-auto overflow-hidden",
                    "bg-transparent" // Transparent to let background show through
                )}
            >
                <Sidebar open={open} setOpen={setOpen}>
                    <SidebarBody className="justify-between gap-10 bg-white/5 backdrop-blur-md border-r border-white/10">
                        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                            {open ? <Logo /> : <LogoIcon />}
                            <div className="mt-8 flex flex-col gap-2">
                                {links.map((link, idx) => (
                                    <SidebarLink key={idx} link={link} />
                                ))}
                            </div>
                        </div>
                        <div>
                            <SidebarLink
                                link={{
                                    label: "Student Account",
                                    href: "#",
                                    icon: (
                                        <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                            S
                                        </div>
                                    ),
                                }}
                            />
                        </div>
                    </SidebarBody>
                </Sidebar>

                {/* Main Content Area */}
                <div className="flex flex-1 relative z-10 overflow-hidden">
                    <div className="flex flex-1 bg-black/40 backdrop-blur-md overflow-y-auto p-4 md:p-10 border-l border-white/10 shadow-2xl">
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Settings Modal (Custom) */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setShowSettings(false)}
                    />
                    <div className="relative bg-zinc-900 border border-zinc-700/50 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 max-w-sm w-full text-center">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                            <Settings size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Settings</h3>
                        <p className="text-zinc-400 mb-6">User preferences and global configurations are coming soon.</p>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const Logo = () => {
    return (
        <Link
            to="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-indigo-500 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-white whitespace-pre"
            >
                PYQ Analyzer
            </motion.span>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            to="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-indigo-500 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        </Link>
    );
};
