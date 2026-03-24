import { useState, useRef } from "react";
import { User, Camera, Save, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function ProfilePage() {
    const adminData = authService.getAdminData();
    const [name, setName] = useState(adminData?.name || "");
    const email = adminData?.email || "";
    const [profileImage, setProfileImage] = useState<string | null>(adminData?.profileImage || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async () => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            if (fileInputRef.current?.files?.[0]) {
                formData.append("profileImage", fileInputRef.current.files[0]);
            }

            await authService.updateProfile(formData);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setUploading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-wider mb-4">
                        <User className="w-3 h-3" />
                        Account Settings
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white italic uppercase">User Profile</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your account information and profile picture</p>
                </div>

                <div className="border-t border-white/5" />

                <Card className="bg-[#0a0a0a] border-white/5 overflow-hidden">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                        <CardTitle className="text-white">Profile Details</CardTitle>
                        <CardDescription className="text-gray-400">Update your public profile information</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div 
                                onClick={handleImageClick}
                                className="relative w-32 h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer group overflow-hidden bg-black/40 hover:border-orange-500/50 transition-colors"
                            >
                                {profileImage ? (
                                    <img 
                                        src={profileImage} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" 
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-gray-500 group-hover:text-orange-500 transition-colors" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
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
                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Tap to upload photo</p>
                        </div>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-400">Display Name</Label>
                                <Input 
                                    id="name" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name" 
                                    className="bg-black/40 border-white/10 rounded-xl focus:border-orange-500/50 h-12 text-white"
                                />
                            </div>
                            <div className="space-y-2 opacity-50">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Address</Label>
                                <Input 
                                    id="email" 
                                    value={email}
                                    disabled
                                    className="bg-black/20 border-white/5 rounded-xl h-12 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-[10px] text-gray-600 italic">Email cannot be changed</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-8 bg-white/[0.01] border-t border-white/5">
                        <Button 
                            onClick={handleUpdateProfile}
                            disabled={uploading}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-orange-900/20 gap-2"
                        >
                            {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AdminLayout>
    );
}
