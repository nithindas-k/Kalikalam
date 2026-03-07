import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { audioService } from "@/services/audioService";
import type { AudioItem, CreateAudioPayload, UpdateAudioPayload } from "@/types/audio.types";
import { MESSAGES } from "@/constants/messages";

export function useAudios() {
    const [audios, setAudios] = useState<AudioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAudios = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await audioService.getAll();
            setAudios(data);
        } catch {
            setError(MESSAGES.FETCH_ERROR);
            toast.error(MESSAGES.FETCH_ERROR);
        } finally {
            setLoading(false);
        }
    }, []);

    const addAudio = async (payload: CreateAudioPayload): Promise<boolean> => {
        try {
            const newAudio = await audioService.create(payload);
            setAudios((prev) => [newAudio, ...prev]);
            toast.success(MESSAGES.UPLOAD_SUCCESS);
            return true;
        } catch {
            toast.error(MESSAGES.UPLOAD_ERROR);
            return false;
        }
    };

    const editAudio = async (id: string, payload: UpdateAudioPayload): Promise<boolean> => {
        try {
            const updated = await audioService.update(id, payload);
            setAudios((prev) => prev.map((a) => (a.id === id ? updated : a)));
            toast.success(MESSAGES.UPDATE_SUCCESS);
            return true;
        } catch {
            toast.error(MESSAGES.UPDATE_ERROR);
            return false;
        }
    };

    const removeAudio = async (id: string): Promise<boolean> => {
        try {
            await audioService.delete(id);
            setAudios((prev) => prev.filter((a) => a.id !== id));
            toast.success(MESSAGES.DELETE_SUCCESS);
            return true;
        } catch {
            toast.error(MESSAGES.DELETE_ERROR);
            return false;
        }
    };

    useEffect(() => {
        fetchAudios();
    }, [fetchAudios]);

    return { audios, loading, error, fetchAudios, addAudio, editAudio, removeAudio };
}
