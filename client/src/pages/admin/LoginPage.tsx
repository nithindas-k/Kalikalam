import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { Lock, LogIn, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authService.login({ email, password });
            toast.success("Welcome back, Admin!");
            navigate(ROUTES.HOME);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md bg-[#0a0a0a]/80 border-white/5 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden relative z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 group hover:border-blue-500/50 transition-all duration-500">
                        <Lock className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Admin Portal</CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                        Welcome back! Please enter your details.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 ml-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@kalikalam.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 rounded-xl py-6 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <Label htmlFor="password" title="password" className="text-gray-300">Password</Label>
                                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot?</a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 rounded-xl py-6 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-7 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            ) : (
                                <>
                                    Sign In
                                    <LogIn className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="pb-10 pt-0 flex flex-col items-center border-t border-white/5 mt-4">
                    <p className="text-gray-400 text-sm mt-6">
                        Don't have an admin account?{" "}
                        <Link to={ROUTES.ADMIN_REGISTER} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                            Register
                        </Link>
                    </p>

                    <div className="mt-8 flex items-center gap-2 text-white/10">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Secure Environment</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
