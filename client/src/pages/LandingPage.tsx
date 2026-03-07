import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UploadDialog from "@/components/UploadDialog";
import { useAudios } from "@/hooks/useAudios";
import { ROUTES } from "@/constants/routes";
import type { CreateAudioPayload } from "@/types/audio.types";

export default function LandingPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { addAudio } = useAudios();
    const navigate = useNavigate();

    const handleSubmit = async (name: string, image: File | null, audio: File | null): Promise<boolean> => {
        if (!image || !audio) return false;
        const payload: CreateAudioPayload = { name, image, audio };
        const success = await addAudio(payload);
        if (success) navigate(ROUTES.AUDIOS);
        return success;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar onAddClick={() => setDialogOpen(true)} />
            <HeroSection onAddClick={() => setDialogOpen(true)} />
            <UploadDialog
                open={dialogOpen}
                mode="add"
                onClose={() => setDialogOpen(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
