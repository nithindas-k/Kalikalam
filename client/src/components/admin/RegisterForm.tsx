import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

export default function RegisterForm() {
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
    );
}
