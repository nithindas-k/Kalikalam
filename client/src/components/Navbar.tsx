import { Mic2, Plus, LogOut, Shield, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import { toast } from "sonner";

interface NavbarProps {
    onAddClick?: () => void;
}

export default function Navbar({ onAddClick }: NavbarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = authService.isAuthenticated();
    const adminData = authService.getAdminData();
    
    // Visitor profile state
    const [visitorName, setVisitorName] = useState(localStorage.getItem("visitor_name") || "");
    const [visitorImage, setVisitorImage] = useState(localStorage.getItem("visitor_image") || "");

    useEffect(() => {
        const updateVisitorProfile = () => {
            setVisitorName(localStorage.getItem("visitor_name") || "");
            setVisitorImage(localStorage.getItem("visitor_image") || "");
        };

        window.addEventListener("visitor-profile-updated", updateVisitorProfile);
        return () => window.removeEventListener("visitor-profile-updated", updateVisitorProfile);
    }, []);

    const handleLogout = () => {
        authService.logout();
        toast.info("Logged out successfully");
        navigate(ROUTES.HOME);
    };

    return (
        <nav className="glass sticky top-0 z-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mic2 className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white uppercase italic">
                            Kali<span className="text-primary">kalam</span>
                        </span>
                    </Link>

                    {/* Nav actions */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {location.pathname !== ROUTES.AUDIOS && (
                            <Link to={ROUTES.AUDIOS}>
                                <Button variant="ghost" size="sm" className="px-2 h-9 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                                    Audios
                                </Button>
                            </Link>
                        )}
                        {location.pathname !== ROUTES.VIDEOS && (
                            <Link to={ROUTES.VIDEOS}>
                                <Button variant="ghost" size="sm" className="px-2 h-9 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                                    Videos
                                </Button>
                            </Link>
                        )}

                        {!isAdmin ? (
                            <div className="flex items-center gap-2">
                                <Link to={ROUTES.ADMIN_LOGIN}>
                                    <Button variant="ghost" size="sm" className="px-2 h-9 text-[10px] font-bold uppercase text-muted-foreground/40 hover:text-foreground hover:bg-white/5 transition-all">
                                        Admin
                                    </Button>
                                </Link>

                                <Link 
                                    to={ROUTES.USER_PROFILE}
                                    className="flex items-center hover:opacity-80 transition-opacity ml-1 group"
                                    title="My Profile"
                                >
                                    <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center transition-all group-hover:border-orange-500/50">
                                        {visitorImage ? (
                                            <img src={visitorImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                        )}
                                    </div>
                                    {visitorName && (
                                        <span className="ml-2 text-xs font-semibold text-white hidden md:block">{visitorName}</span>
                                    )}
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mr-2 pr-2 border-r border-white/10">
                                <Link to={ROUTES.ADMIN_REQUESTS} title="Dashboard">
                                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors">
                                        <Shield className="w-4.5 h-4.5" />
                                    </Button>
                                </Link>
                                
                                <Link to={ROUTES.PROFILE} title="Admin Profile" className="group">
                                    <div className="w-9 h-9 rounded-full border border-orange-500/20 overflow-hidden bg-orange-500/5 flex items-center justify-center transition-all group-hover:border-orange-500/50">
                                        {adminData?.profileImage ? (
                                            <img src={adminData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-orange-500" />
                                        )}
                                    </div>
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-9 h-9 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                    onClick={handleLogout}
                                    title="Logout"
                                >
                                    <LogOut className="w-4.5 h-4.5" />
                                </Button>
                            </div>
                        )}

                        <Button
                            size="sm"
                            className="h-9 px-3 gap-1 sm:gap-1.5 font-semibold shadow-lg shadow-primary/20 bg-orange-600 hover:bg-orange-500"
                            onClick={onAddClick}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Add Clip</span>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
