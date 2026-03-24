import * as React from "react";
import { Mic2, LogOut, Shield, User, MessageCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SidebarTrigger, SidebarContext } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = authService.isAuthenticated();
    const adminData = authService.getAdminData();
    const { user, login } = useAuth();
    const sidebar = React.useContext(SidebarContext);

    const handleLogout = () => {
        authService.logout();
        toast.info("Admin logged out");
        navigate(ROUTES.HOME);
    };

    return (
        <nav className="glass sticky top-0 z-50 w-full">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-1">
                        {sidebar && <SidebarTrigger className="lg:hidden text-white/50 hover:text-white transition-colors" />}
                        <Link to={ROUTES.HOME} className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                            <Mic2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-black" />
                        </div>
                        <span className="text-[11px] sm:text-lg font-black tracking-tight text-white uppercase italic">
                            Kali<span className="text-primary">kalam</span>
                        </span>
                    </Link>
                    </div>

                    {/* Nav actions */}
                    <div className="flex items-center gap-0.5 sm:gap-3">
                        <div className="hidden md:flex items-center gap-0.5">
                            {location.pathname !== ROUTES.AUDIOS && (
                                <Link to={ROUTES.AUDIOS} title="Audios">
                                    <Button variant="ghost" size="sm" className="px-1.5 sm:px-3 h-8 sm:h-9 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                                        Audios
                                    </Button>
                                </Link>
                            )}
                            {location.pathname !== ROUTES.VIDEOS && (
                                <Link to={ROUTES.VIDEOS} title="Videos">
                                    <Button variant="ghost" size="sm" className="px-1.5 sm:px-3 h-8 sm:h-9 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                                        Videos
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {!isAdmin ? (
                            <div className="flex items-center gap-0.5 sm:gap-2">
                                <Link to={ROUTES.ADMIN_LOGIN} title="Admin Portal">
                                    <Button variant="ghost" size="sm" className="px-1 sm:px-2 h-8 sm:h-9 text-[9px] font-black uppercase tracking-wider text-muted-foreground/30 hover:text-foreground hover:bg-white/5 transition-all">
                                        Admin
                                    </Button>
                                </Link>

                                {/* Chat icon */}
                                <Link
                                    to={ROUTES.CHAT}
                                    className="flex items-center hover:opacity-80 transition-opacity group"
                                    title="Global Chat"
                                >
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white/40 hover:text-orange-400 hover:bg-orange-500/10 transition-all">
                                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                </Link>

                                {user ? (
                                    <Link 
                                        to={ROUTES.USER_PROFILE}
                                        className="flex items-center hover:opacity-80 transition-opacity ml-1 group"
                                        title="My Profile"
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center transition-all group-hover:border-orange-500/50 shadow-inner">
                                            {user.image ? (
                                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                            )}
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="ml-1 scale-90 sm:scale-100 flex items-center justify-center overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/10 h-8 sm:h-10 w-8 sm:w-10 flex-shrink-0">
                                        <GoogleLogin 
                                            onSuccess={async (credentialResponse) => {
                                                if (credentialResponse.credential) {
                                                    try {
                                                        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/google`, {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ credential: credentialResponse.credential }),
                                                        });
                                                        const data = await res.json();
                                                        if (data.token && data.user) {
                                                            login(data.token, data.user);
                                                            toast.success(`Welcome back, ${data.user.name}!`);
                                                        }
                                                    } catch (err) {
                                                        toast.error("Login Failed");
                                                    }
                                                }
                                            }}
                                            onError={() => toast.error("Login Cancelled")}
                                            type="icon"
                                            theme="filled_black"
                                            shape="circle"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2 pr-1 sm:pr-2 border-r border-white/10">
                                <Link to={ROUTES.ADMIN_REQUESTS} title="Dashboard">
                                    <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors">
                                        <Shield className="w-4 h-4" />
                                    </Button>
                                </Link>

                                <Link to={ROUTES.PROFILE} title="Admin Profile" className="group">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-orange-500/20 overflow-hidden bg-orange-500/5 flex items-center justify-center transition-all group-hover:border-orange-500/50">
                                        {adminData?.profileImage ? (
                                            <img src={adminData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                                        )}
                                    </div>
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                    onClick={handleLogout}
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        

                    </div>
                </div>
            </div>
        </nav>
    );
}
