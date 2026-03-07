import { ArrowDown, Mic2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

interface HeroSectionProps {
    onAddClick: () => void;
}

export default function HeroSection({ onAddClick }: HeroSectionProps) {
    const navigate = useNavigate();

    return (
        <section className="hero-gradient min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
                <Mic2 className="w-3.5 h-3.5" />
                Comedy Audio Vault
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 leading-tight">
                The Laughs of
                <br />
                <span className="text-primary">Our Crew</span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-xl mb-10">
                Upload, listen and relive the funniest moments from your people. Pure gold, forever saved.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Button
                    size="lg"
                    className="w-full sm:w-auto gap-2 font-bold text-base px-8"
                    onClick={() => navigate(ROUTES.AUDIOS)}
                >
                    <Play className="w-4 h-4 fill-current" />
                    Listen Now
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto gap-2 font-semibold text-base px-8 border-primary/40 hover:border-primary"
                    onClick={onAddClick}
                >
                    + Add a Clip
                </Button>
            </div>

            {/* Scroll hint */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground animate-bounce">
                <span className="text-xs tracking-widest uppercase">Scroll</span>
                <ArrowDown className="w-4 h-4" />
            </div>
        </section>
    );
}
