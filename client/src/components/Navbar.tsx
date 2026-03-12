import { Mic2, Plus, LogOut, Shield } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
                        <span className="text-lg font-bold tracking-tight">
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

                        {isAdmin ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="px-2 h-9 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        ) : (
                            <Link to={ROUTES.ADMIN_LOGIN}>
                                <Button variant="ghost" size="sm" className="px-2 h-9 text-xs sm:text-sm text-muted-foreground hover:text-foreground gap-1.5">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Admin</span>
                                </Button>
                            </Link>
                        )}

                        <Button
                            size="sm"
                            className="h-9 px-3 gap-1 sm:gap-1.5 font-semibold shadow-lg shadow-primary/20"
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
