import Navbar from "@/components/Navbar";
import { Shield } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full animate-pulse" />

            <Navbar />

            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 w-full overflow-y-auto">
                <div className="w-full max-w-[380px] my-auto animate-in fade-in zoom-in duration-500">
                    {children}
                </div>
            </div>

            {/* Bottom floating mark */}
            <div className="absolute bottom-8 flex items-center gap-2 text-white/20 select-none">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium tracking-widest uppercase">Kalikalam Security</span>
            </div>
        </div>
    );
}
