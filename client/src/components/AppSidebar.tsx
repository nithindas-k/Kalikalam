import { Link, useLocation } from "react-router-dom"
import { Mic2, MessageCircle, Music, Play, User, Shield, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { authService } from "@/services/authService"
import { ROUTES } from "@/constants/routes"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"

import { cn } from "@/lib/utils"

export function AppSidebar() {
    const location = useLocation()
    const { user } = useAuth()
    const isAdmin = authService.isAuthenticated()
    const { open, setOpen, isMobile } = useSidebar()

    const navItems = [
        { label: "Home", path: ROUTES.HOME, icon: Mic2 },
        { label: "Audios", path: ROUTES.AUDIOS, icon: Music },
        { label: "Videos", path: ROUTES.VIDEOS, icon: Play },
        { label: "Chat", path: ROUTES.CHAT, icon: MessageCircle },
    ]

    const adminItems = [
        { label: "Dashboard", path: ROUTES.ADMIN_REQUESTS, icon: Shield },
        { label: "Audios", path: ROUTES.ADMIN_AUDIOS, icon: Music },
        { label: "Videos", path: ROUTES.ADMIN_VIDEOS, icon: Play },
    ]

    return (
        <Sidebar>
            <SidebarHeader className={cn("flex items-center", open ? "justify-between px-4" : "justify-center py-4")}>
                {open && (
                    <Link to={ROUTES.HOME} className="flex items-center gap-2 group overflow-hidden animate-in fade-in duration-300">
                    <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-orange-500/20 shrink-0">
                        <Mic2 className="w-4 h-4 text-black" />
                    </div>
                    {open && (
                        <span className="text-base font-black tracking-tight text-white uppercase italic animate-in fade-in duration-300">
                            Kali<span className="text-orange-500">kalam</span>
                        </span>
                    )}
                </Link>
                )}
                <SidebarTrigger />
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarMenu>
                        {navItems.map(item => (
                            <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton asChild isActive={location.pathname === item.path}>
                                    <Link to={item.path} onClick={() => isMobile && setOpen(false)} className="flex items-center gap-3 w-full">
                                        <item.icon className="w-4 h-4" />
                                        {open && <span className="animate-in fade-in duration-200">{item.label}</span>}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Admin Control</SidebarGroupLabel>
                        <SidebarMenu>
                            {adminItems.map(item => (
                                <SidebarMenuItem key={item.path}>
                                    <SidebarMenuButton asChild isActive={location.pathname === item.path}>
                                        <Link to={item.path} onClick={() => isMobile && setOpen(false)} className="flex items-center gap-3 w-full">
                                            <item.icon className="w-4 h-4 text-orange-400" />
                                            {open && <span className="animate-in fade-in duration-200">{item.label}</span>}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    {user && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={location.pathname === ROUTES.USER_PROFILE}>
                                <Link to={ROUTES.USER_PROFILE} onClick={() => isMobile && setOpen(false)} className="flex items-center gap-3 w-full">
                                    {user.image ? (
                                        <img src={user.image} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                    {open && <span className="truncate animate-in fade-in duration-200">{user.name}</span>}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    
                    {isAdmin && (
                        <SidebarMenuItem>
                            <SidebarMenuButton 
                                onClick={() => authService.logout()}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/5 mt-1"
                            >
                                <LogOut className="w-4 h-4" />
                                {open && <span className="opacity-80 animate-in fade-in duration-200">Logout</span>}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
