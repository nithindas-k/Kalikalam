import { useState, useCallback, useEffect } from "react";
import { videoService } from "../services/videoService";
import type { VideoItem } from "../types/video.types";
import { toast } from "sonner";
import { MESSAGES } from "../constants/messages";

export interface CreateVideoPayload {
    name: string;
    video: File;
    startTime: number;
    endTime: number;
    isPrivate: boolean;
    accessKey: string;
}

export function useVideos() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await videoService.getAll();
            setVideos(data);
        } catch (err: any) {
            setError(err.message || "Failed to load videos");
            toast.error("Failed to load videos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    const addVideo = async (payload: CreateVideoPayload): Promise<boolean> => {
        try {
            await videoService.create(
                payload.name,
                payload.video,
                payload.startTime,
                payload.endTime,
                payload.isPrivate,
                payload.accessKey
            );
            toast.success("Video uploaded successfully!");
            await fetchVideos();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to upload video");
            return false;
        }
    };

    const removeVideo = async (id: string): Promise<boolean> => {
        try {
            await videoService.delete(id);
            toast.success(MESSAGES.DELETE_SUCCESS);
            setVideos((prev) => prev.filter((v) => v.id !== id));
            return true;
        } catch {
            toast.error("Failed to delete video");
            return false;
        }
    };

    return {
        videos,
        loading,
        error,
        fetchVideos,
        addVideo,
        removeVideo,
    };
}
