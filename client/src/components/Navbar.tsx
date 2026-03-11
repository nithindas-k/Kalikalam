import { Mic2, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

interface NavbarProps {
    onAddClick?: () => void;
}

export default function Navbar({ onAddClick }: NavbarProps) {
    const location = useLocation();

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
                        <Button
                            size="sm"
                            className="h-9 px-3 gap-1 sm:gap-1.5 font-semibold"
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
