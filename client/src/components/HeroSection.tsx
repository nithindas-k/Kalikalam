import { Mic2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

interface HeroSectionProps {
    onAddClick: () => void;
}

export default function HeroSection({ onAddClick }: HeroSectionProps) {
    const navigate = useNavigate();
    const { user, login } = useAuth();

    // 🔒 Custom Google Login Trigger
    const googleTrigger = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: tokenResponse.access_token }), // 🔑 Uses backend accessToken supporting stream
                });
                const data = await res.json();
                if (data.token && data.user) {
                    login(data.token, data.user);
                    toast.success(`Welcome, ${data.user.name}!`);
                }
            } catch (err) {
                toast.error("Login failed");
            }
        },
        onError: () => toast.error("Google login cancelled"),
    });

    return (
        <section className="hero-gradient min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
                <Mic2 className="w-3.5 h-3.5" />
                Comedy Audio Vault
            </div>

            {/* Headline */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1] sm:leading-tight">
                The Laughs of
                <br />
                <span className="text-primary">Our Crew</span>
            </h1>

            <p className="text-muted-foreground text-sm sm:text-lg md:text-xl max-w-[280px] xs:max-w-md sm:max-w-xl mb-12 leading-relaxed px-2">
                Upload, listen and relive the funniest moments from your crew. Pure gold, forever saved.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full justify-center">
                <Button
                    size="lg"
                    className="w-full sm:w-auto max-w-[280px] gap-2 font-bold text-base px-8 bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/10 h-11"
                    onClick={() => navigate(ROUTES.AUDIOS)}
                >
                    <Play className="w-4 h-4 fill-current" />
                    Listen Now
                </Button>

                {user ? (
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto max-w-[280px] gap-2 font-semibold text-sm px-8 border-primary/40 hover:border-primary transition-transform active:scale-95 text-white h-11"
                        onClick={onAddClick}
                    >
                        + Add a Clip
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto max-w-[280px] gap-2 font-semibold text-sm px-8 border-white/10 hover:border-white/20 hover:bg-white/5 transition-transform active:scale-95 text-white h-11 flex items-center justify-center -mt-0.5"
                        onClick={() => googleTrigger()}
                    >
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
                            alt="G" 
                            className="w-4 h-4 mr-0.5" 
                        />
                        Add a Clip
                    </Button>
                )}
            </div>
        </section>
    );
}
