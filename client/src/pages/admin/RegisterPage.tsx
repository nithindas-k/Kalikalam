import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { Shield, UserPlus, ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const data = await authService.register({ email, password });
            toast.success(data.message || "Admin registered successfully");

            if (data.status === "pending") {
                navigate(ROUTES.ADMIN_LOGIN);
            } else {
                navigate(ROUTES.HOME);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full animate-pulse" />

            <Card className="w-full max-w-md bg-[#0a0a0a]/80 border-white/5 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden relative z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500" />

                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 group hover:border-orange-500/50 transition-all duration-500">
                        <UserPlus className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Create Admin Account</CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                        Enter your credentials to manage Kalikalam
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300 ml-1">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 rounded-xl py-6 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="text-gray-300 ml-1">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 rounded-xl py-6 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" title="confirm password" className="text-gray-300 ml-1">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 rounded-xl py-6 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-7 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-lg shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            ) : (
                                <>
                                    Register Account
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="pb-10 pt-0 flex justify-center border-t border-white/5 mt-4">
                    <p className="text-gray-400 text-sm mt-6">
                        Already have an account?{" "}
                        <Link to={ROUTES.ADMIN_LOGIN} className="text-orange-400 font-semibold hover:text-orange-300 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>

            {/* Bottom floating mark */}
            <div className="absolute bottom-8 flex items-center gap-2 text-white/20 select-none">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium tracking-widest uppercase">Kalikalam Security</span>
            </div>
        </div>
    );
}
