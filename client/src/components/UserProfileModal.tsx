import { X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserProfileModalProps {
    user: { name: string; image?: string } | null;
    open: boolean;
    onClose: () => void;
    isOnline?: boolean;
}

export default function UserProfileModal({ user, open, onClose, isOnline }: UserProfileModalProps) {
    if (!user) return null;

    return (
        <>
     
            <div 
                className={cn(
                    "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

           
            <div 
                className={cn(
                    "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[260px]",
                    "bg-[#0a0a0a]/90 border border-white/[0.06] backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out transform",
                    open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                )}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
                >
                    <X className="w-3.5 h-3.5 text-white/40" />
                </button>

                <div className="p-5 flex flex-col items-center gap-3">
                    <div className="relative">
                        <Avatar className="w-16 h-16 border border-white/5 shadow-md">
                            {user.image ? (
                                <AvatarImage src={user.image} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white font-black text-lg">
                                {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0a0a0a] shadow-sm animate-pulse" />
                        )}
                    </div>

                    <div className="text-center">
                        <h3 className="text-sm font-black text-white tracking-wide">{user.name}</h3>
                        <p className="text-[10px] text-white/40 font-semibold tracking-wider mt-0.5">
                            {isOnline ? "Online" : "Member"}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
