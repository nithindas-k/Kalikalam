import { useState, useEffect, useRef } from "react";
import { User, Camera, Save, ArrowLeft, Trash2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function UserProfilePage() {
    const navigate = useNavigate();
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
    }, []);

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
        if (!name.trim()) {
            toast.error("Please enter your name");
            return;
        }
        setSaving(true);
        try {
            localStorage.setItem("visitor_name", name);
            if (image) {
                localStorage.setItem("visitor_image", image);
            } else {
                localStorage.removeItem("visitor_image");
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success("Profile updated successfully!");
            window.dispatchEvent(new Event("visitor-profile-updated"));
            navigate(ROUTES.HOME);
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to reset your local profile?")) {
            setName("");
            setImage(null);
            localStorage.removeItem("visitor_name");
            localStorage.removeItem("visitor_image");
            window.dispatchEvent(new Event("visitor-profile-updated"));
            toast.info("Profile reset");
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            
            <main className="max-w-2xl mx-auto px-4 py-12">
                {/* Back button */}
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)}
                    className="mb-8 text-muted-foreground hover:text-white group gap-2"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back
                </Button>

                <Card className="border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
                    
                    <CardHeader className="text-center pb-2 relative">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center mb-4">
                            <User className="w-8 h-8 text-orange-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-white mb-2">My Profile</CardTitle>
                        <CardDescription className="text-muted-foreground max-w-sm mx-auto">
                            Personalize your experience. This profile is stored locally on your device for privacy.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-10 p-8 relative">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-6">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-40 h-40 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer group overflow-hidden bg-black/60 hover:border-orange-500/50 transition-all shadow-2xl"
                            >
                                {image ? (
                                    <img src={image} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <User className="w-16 h-16 text-gray-700 group-hover:text-orange-500 transition-colors" />
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Select Photo</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                            {image && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setImage(null)}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/5"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove Avatar
                                </Button>
                            )}
                        </div>

                        {/* Form Section */}
                        <div className="space-y-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="user-name" className="text-sm font-bold uppercase tracking-widest text-gray-400 ml-1">Your Full Name</Label>
                                <Input 
                                    id="user-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name..."
                                    className="bg-black/60 border-white/10 h-14 rounded-2xl focus:border-orange-500/50 focus:ring-0 text-lg font-semibold px-6"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <Button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-14 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-900/20 gap-2 text-lg"
                                >
                                    {saving ? "Saving..." : <><Save className="w-5 h-5" /> Save Changes</>}
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={handleClear}
                                    className="h-14 border-white/5 bg-white/5 hover:bg-white/10 hover:text-white rounded-2xl font-bold"
                                >
                                    Reset Profile
                                </Button>
                            </div>
                        </div>

                        {/* Security Note */}
                        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                            <Shield className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                            <p className="text-xs text-blue-200/50 leading-relaxed">
                                <strong>No login required.</strong> Your name and photo are saved directly to your browser's local storage and are never uploaded to our servers unless you choose to share them.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
