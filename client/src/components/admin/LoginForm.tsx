import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginForm() {
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
                    className="bg-white/5 border-white/10 rounded-xl py-6 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                    <Label htmlFor="password" title="password" className="text-gray-300">Password</Label>
                    <a href="#" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">Forgot?</a>
                </div>
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

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-7 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-lg shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
    );
}
