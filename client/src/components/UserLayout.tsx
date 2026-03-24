import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { VoiceChatProvider } from "@/context/VoiceChatContext"
import MobileBottomNav from "@/components/MobileBottomNav"

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <VoiceChatProvider>
                <AppSidebar />
                <div className="flex-1 overflow-y-auto w-full bg-[#040404] relative pb-16 lg:pb-0">
                    {children}
                </div>
                <MobileBottomNav />
            </VoiceChatProvider>
        </SidebarProvider>
    )
}
