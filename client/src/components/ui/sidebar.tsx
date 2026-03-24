import * as React from "react"
import { PanelLeft, PanelLeftClose } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarContextType {
    open: boolean
    setOpen: (open: boolean) => void
    isMobile: boolean
    toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
    const context = React.useContext(SidebarContext)
    if (!context) throw new Error("useSidebar must be used within SidebarProvider")
    return context
}

export function SidebarProvider({
    children,
    defaultOpen = true,
}: {
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = React.useState(defaultOpen)
    const [isMobile, setIsMobile] = React.useState(false)

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const toggleSidebar = () => setOpen(prev => !prev)

    return (
        <SidebarContext.Provider value={{ open, setOpen, isMobile, toggleSidebar }}>
            <div className="flex h-svh w-full overflow-hidden bg-[#0a0a0a] text-white">
                {children}
            </div>
        </SidebarContext.Provider>
    )
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
    const { open, isMobile, setOpen } = useSidebar()

    if (isMobile) {
        return (
            <>
                {/* Mobile Backdrop */}
                {open && (
                    <div 
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setOpen(false)}
                    />
                )}
                {/* Mobile Drawer */}
                <aside 
                    className={cn(
                        "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0c0c0c] border-r border-white/5 flex flex-col transition-transform duration-300 ease-out transform",
                        open ? "translate-x-0" : "-translate-x-full",
                        className
                    )}
                >
                    {children}
                </aside>
            </>
        )
    }

    return (
        <aside 
            className={cn(
                "hidden lg:flex flex-col bg-[#0c0c0c]/80 backdrop-blur-xl border-r border-white/[0.06] transition-all duration-300 ease-in-out shrink-0",
                open ? "w-64" : "w-[68px]",
                className
            )}
        >
            {children}
        </aside>
    )
}

export function SidebarHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
    return <div className={cn("p-4 border-b border-white/[0.04] flex items-center justify-between min-h-[64px]", className)}>{children}</div>
}

export function SidebarContent({ children, className }: { children?: React.ReactNode; className?: string }) {
    return <div className={cn("flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 space-y-4", className)}>{children}</div>
}

export function SidebarFooter({ children, className }: { children?: React.ReactNode; className?: string }) {
    return <div className={cn("p-4 border-t border-white/[0.04]", className)}>{children}</div>
}

export function SidebarGroup({ children, className }: { children?: React.ReactNode; className?: string }) {
    return <div className={cn("px-3 space-y-1", className)}>{children}</div>
}

export function SidebarGroupLabel({ children, className }: { children?: React.ReactNode; className?: string }) {
    const { open } = useSidebar()
    if (!open) return null
    return <div className={cn("px-3 text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5", className)}>{children}</div>
}

export function SidebarGroupContent({ children }: { children?: React.ReactNode }) {
    return <div className="space-y-1">{children}</div>
}

export function SidebarTrigger({ className }: { className?: string }) {
    const { toggleSidebar, open } = useSidebar()
    return (
        <button
            onClick={toggleSidebar}
            className={cn("w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all", className)}
        >
            {open ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>
    )
}

export function SidebarMenu({ children }: { children?: React.ReactNode }) {
    return <ul className="space-y-1">{children}</ul>
}

export function SidebarMenuItem({ children }: { children?: React.ReactNode }) {
    return <li>{children}</li>
}

export function SidebarMenuButton({
    children,
    isActive,
    asChild,
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean; asChild?: boolean }) {
    const { open } = useSidebar()
    return (
        <button
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm text-white/50 hover:text-white hover:bg-white/[0.03] group relative",
                isActive && "bg-orange-500/10 text-orange-400 font-bold border border-orange-500/10 shadow-sm",
                !open && "justify-center px-0 w-10 mx-auto",
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}
