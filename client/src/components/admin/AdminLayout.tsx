import React from "react";
import AdminSidebar from "./AdminSidebar";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#050505] overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            <div className={cn(
                "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )} onClick={() => setIsSidebarOpen(false)} />

            {/* Mobile Sidebar Content */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-300 ease-out",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <AdminSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-white/5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-white hover:bg-white/5"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                    <span className="text-xl font-bold text-white tracking-tight">Kali<span className="text-orange-500">kalam</span></span>
                    
                    <Link to={ROUTES.PROFILE} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full ring-offset-background transition-shadow">
                        <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                            {authService.getAdminData()?.profileImage ? (
                                <img src={authService.getAdminData().profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-gray-500" />
                            )}
                        </div>
                    </Link>
                </header>

                {/* Sub-header / Breadcrumbs (Optional) */}
                <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </div>

                {/* Background decorative blurs */}
                <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
            </div>
        </div>
    );
}
