import { Link, useLocation } from "react-router-dom";
import { Mic2, MessageCircle, Music, Play } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function MobileBottomNav() {
    const location = useLocation();
    const { user } = useAuth();

    if (location.pathname === ROUTES.CHAT) return null;

    const navItems = [
        { label: "Home", path: ROUTES.HOME, icon: Mic2 },
        { label: "Audios", path: ROUTES.AUDIOS, icon: Music },
        { label: "Videos", path: ROUTES.VIDEOS, icon: Play },
        { label: "Room", path: "/voice", icon: Mic2 },
        { label: "Chat", path: ROUTES.CHAT, icon: MessageCircle, protected: true },
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0c]/90 backdrop-blur-xl border-t border-white/[0.06] pb-safe shadow-2xl">
            <div className="flex items-center justify-around h-16 px-1 sm:px-2">
                {navItems.map(item => {
                    if (item.protected && !user) return null;
                    
                    const isActive = location.pathname === item.path;
                    return (
                        <Link 
                            key={item.path} 
                            to={item.path} 
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 group",
                                isActive ? "text-orange-400" : "text-white/40 hover:text-white/80"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-xl transition-colors duration-300",
                                isActive ? "bg-orange-500/10" : "group-hover:bg-white/5"
                            )}>
                                <item.icon className={cn("w-5 h-5", isActive && "animate-in zoom-in duration-300")} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
