import { useState, useEffect, useRef } from "react";
import { User, Camera, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import ImageCropDialog from "@/components/ImageCropDialog";

export default function UserProfilePage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load from local storage
    useEffect(() => {
        const savedName = localStorage.getItem("visitor_name");
        const savedImage = localStorage.getItem("visitor_image");
        if (savedName) setName(savedName);
        if (savedImage) setImage(savedImage);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image too large (max 5MB)");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setShowCropper(false);
            setTempImage(null);
        };
        reader.readAsDataURL(croppedBlob);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            localStorage.setItem("visitor_name", name.trim());
            if (image) {
                localStorage.setItem("visitor_image", image);
            } else {
                localStorage.removeItem("visitor_image");
            }
            
            await new Promise(resolve => setTimeout(resolve, 600));
            toast.success("Profile saved");
            window.dispatchEvent(new Event("visitor-profile-updated"));
            navigate(ROUTES.HOME);
        } catch (error) {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-orange-500/30">
            <Navbar />
            
            <main className="max-w-md mx-auto px-6 py-20 flex flex-col items-center">
                {/* Minimal Header */}
                <div className="w-full flex items-center justify-between mb-12">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-white/5 text-gray-500 transition-colors"
                        title="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-400">Profile Settings</h1>
                    <div className="w-9" /> {/* Spacer */}
                </div>

                {/* Main Content */}
                <div className="w-full space-y-12">
                    
                    {/* Minimal Avatar Section */}
                    <div className="flex flex-col items-center group">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-48 h-48 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center cursor-pointer transition-all duration-500 hover:border-orange-500/40 hover:scale-[1.02] active:scale-95 shadow-2xl group"
                        >
                            {image ? (
                                <img src={image} alt="Profile" className="w-full h-full rounded-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                            ) : (
                                <User className="w-16 h-16 text-gray-700 group-hover:text-orange-500 transition-colors" />
                            )}
                            
                            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                <Camera className="w-10 h-10 text-white shadow-xl" />
                            </div>

                            {/* Status Indicator */}
                            <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-[#020202] flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-black" />
                            </div>
                        </div>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileSelect} 
                        />
                        
                        {image && (
                            <button 
                                onClick={() => setImage(null)}
                                className="mt-4 text-[10px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
                            >
                                Remove Photo
                            </button>
                        )}
                    </div>

                    {/* Name Input - Minimalist */}
                    <div className="space-y-2">
                        <Input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            className="bg-transparent border-0 border-b border-white/5 rounded-none text-2xl font-bold text-center h-16 focus-visible:ring-0 focus:border-orange-500/50 transition-colors placeholder:text-gray-800"
                        />
                        <p className="text-[10px] text-center text-gray-600 font-medium uppercase tracking-[0.2em]">Private & Local Identity</p>
                    </div>

                    <div className="pt-8 space-y-4">
                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-14 bg-white text-black hover:bg-white/90 font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-white/5"
                        >
                            {saving ? "Updating..." : "Save Profile"}
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate(ROUTES.HOME)}
                            className="w-full h-12 text-gray-500 hover:text-white font-medium rounded-2xl"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="mt-20 flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02]">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Private & Local</span>
                </div>
            </main>

            {tempImage && (
                <ImageCropDialog 
                    image={tempImage}
                    open={showCropper}
                    onClose={() => {
                        setShowCropper(false);
                        setTempImage(null);
                    }}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1} // Square for profile
                />
            )}
        </div>
    );
}
