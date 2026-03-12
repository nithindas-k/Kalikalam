import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { Lock, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/admin/AuthLayout";
import LoginForm from "@/components/admin/LoginForm";

export default function LoginPage() {
    return (
        <AuthLayout>
            <Card className="w-full bg-[#0a0a0a]/80 border-white/5 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500" />

                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 group hover:border-orange-500/50 transition-all duration-500">
                        <Lock className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">Admin Portal</CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                        Welcome back! Please enter your details.
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <LoginForm />
                </CardContent>

                <CardFooter className="pb-10 pt-0 flex flex-col items-center border-t border-white/5 mt-4">
                    <p className="text-gray-400 text-sm mt-6">
                        Don't have an admin account?{" "}
                        <Link to={ROUTES.ADMIN_REGISTER} className="text-orange-400 font-semibold hover:text-orange-300 transition-colors">
                            Register
                        </Link>
                    </p>

                    <div className="mt-8 flex items-center gap-2 text-white/10">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Secure Environment</span>
                    </div>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
}
