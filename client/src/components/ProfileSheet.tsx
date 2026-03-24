import { useState, useEffect, useRef } from "react";
import { User, Camera, X, Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfileSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileSheet({ isOpen, onClose }: ProfileSheetProps) {
    const [name, setName] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load from local storage
    useEffect(() => {
        const savedName = localStorage.getItem("visitor_name");
        const savedImage = localStorage.getItem("visitor_image");
        if (savedName) setName(savedName);
        if (savedImage) setImage(savedImage);
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image size must be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            localStorage.setItem("visitor_name", name);
            if (image) {
                localStorage.setItem("visitor_image", image);
            } else {
                localStorage.removeItem("visitor_image");
            }
            
            // Artificial delay for premium feel
            await new Promise(resolve => setTimeout(resolve, 600));
            toast.success("Profile saved locally");
            onClose();
            // Dispatch a custom event to notify other components (like Navbar)
            window.dispatchEvent(new Event("visitor-profile-updated"));
        } catch (error) {
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        setName("");
        setImage(null);
        localStorage.removeItem("visitor_name");
        localStorage.removeItem("visitor_image");
        toast.info("Profile cleared");
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className={cn(
                    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div 
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-background border-l border-white/5 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-600/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-500" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-white italic uppercase">My Profile</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Visitor Info Note */}
                    <div className="p-4 rounded-xl bg-orange-600/5 border border-orange-600/10">
                        <p className="text-xs text-orange-200/60 text-center leading-relaxed">
                            This profile is stored locally on your device for a personalized experience. No account required.
                        </p>
                    </div>

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-32 h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer group overflow-hidden bg-black/40 hover:border-orange-500/50 transition-all shadow-xl"
                        >
                            {image ? (
                                <img src={image} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                                <User className="w-12 h-12 text-gray-600 group-hover:text-orange-500 transition-colors" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                        />
                        <div className="text-center">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Tap to upload your photo</span>
                            {image && (
                                <button onClick={(e) => { e.stopPropagation(); setImage(null); }} className="block mx-auto mt-2 text-[10px] text-red-500 hover:underline">
                                    Remove photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-3">
                        <Label htmlFor="visitor-name" className="text-xs font-bold uppercase tracking-widest text-gray-400">What's your name?</Label>
                        <Input 
                            id="visitor-name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Type your name here..."
                            className="bg-black/40 border-white/10 h-12 rounded-xl focus:border-orange-500/50 focus:ring-0 text-white placeholder:text-gray-700 font-semibold"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/20 space-y-3">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || !name.trim()}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-900/20 gap-2 transition-transform active:scale-95"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Profile
                    </Button>
                    
                    <Button 
                        variant="ghost" 
                        onClick={handleClear}
                        className="w-full text-gray-500 hover:text-red-400 hover:bg-red-500/5 text-xs font-bold gap-2"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reset All
                    </Button>
                </div>
            </div>
        </>
    );
}
