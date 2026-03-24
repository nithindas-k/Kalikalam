import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="flex-1 overflow-y-auto w-full bg-[#040404]">
                {children}
            </div>
        </SidebarProvider>
    )
}
