import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import {
    Users,
    Mic2,
    Video,
    ChevronRight,
    LogOut,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        {
            title: "Requests",
            icon: Users,
            path: ROUTES.ADMIN_REQUESTS,
        },
        {
            title: "Audios",
            icon: Mic2,
            path: ROUTES.ADMIN_AUDIOS,
        },
        {
            title: "Videos",
            icon: Video,
            path: ROUTES.ADMIN_VIDEOS,
        },
        {
            title: "Profile",
            icon: User,
            path: ROUTES.PROFILE,
        },
    ];

    const handleLogout = () => {
        authService.logout();
        toast.info("Logged out successfully");
        navigate(ROUTES.HOME);
    };

    const adminData = authService.getAdminData();

    return (
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col h-full overflow-hidden">
            {/* Logo Section */}
            <div className="p-6">
                <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-orange-900/40">
                        <Mic2 className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Kali<span className="text-orange-500">kalam</span>
                    </span>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                <div className="text-[10px] uppercase tracking-widest font-bold text-white/30 px-3 mb-4">
                    Management
                </div>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}>
                            <div className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                                isActive
                                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                            )}>
                                <div className="flex items-center gap-3">
                                    <item.icon className={cn(
                                        "w-5 h-5",
                                        isActive ? "text-orange-500" : "text-gray-400 group-hover:text-white"
                                    )} />
                                    <span className="font-semibold text-sm">{item.title}</span>
                                </div>
                                {isActive && (
                                    <ChevronRight className="w-4 h-4 bg-orange-500 text-black rounded-full" />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Section */}
            <div className="p-4 border-t border-white/5 bg-black/20 space-y-4">
                <Link to={ROUTES.PROFILE} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                        {adminData?.profileImage ? (
                            <img src={adminData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{adminData?.name || "Admin"}</p>
                        <p className="text-[10px] text-gray-500 truncate">{adminData?.email || "admin@kalikalam.com"}</p>
                    </div>
                </Link>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3 rounded-xl py-6"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Logout</span>
                </Button>
            </div>
        </aside>
    );
}
