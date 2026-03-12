import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { UserPlus } from "lucide-react";
import AuthLayout from "@/components/admin/AuthLayout";
import RegisterForm from "@/components/admin/RegisterForm";

export default function RegisterPage() {
    return (
        <AuthLayout>
            <Card className="w-full bg-[#0a0a0a]/80 border-white/5 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500" />

                <CardHeader className="pt-8 pb-4 text-center">
                    <div className="mx-auto w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-3 border border-white/10 group hover:border-orange-500/50 transition-all duration-500">
                        <UserPlus className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Create Admin</CardTitle>
                    <CardDescription className="text-gray-400 mt-1 text-xs">
                        Enter your credentials to manage Kalikalam
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                    <RegisterForm />
                </CardContent>

                <CardFooter className="pb-8 pt-0 flex justify-center border-t border-white/5 mt-2">
                    <p className="text-gray-400 text-xs mt-4">
                        Already have an account?{" "}
                        <Link to={ROUTES.ADMIN_LOGIN} className="text-orange-400 font-semibold hover:text-orange-300 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
}
