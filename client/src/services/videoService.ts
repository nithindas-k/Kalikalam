import axios from "axios";
import { getDeviceId } from "@/utils/device";
import type { VideoItem } from "@/types/video.types";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
    config.headers["X-Creator-Id"] = getDeviceId();
    return config;
});

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const videoService = {
    getAll: async (): Promise<VideoItem[]> => {
        const res = await api.get<ApiResponse<VideoItem[]>>("/videos");
        return res.data.data;
    },

    getById: async (id: string): Promise<VideoItem> => {
        const res = await api.get<ApiResponse<VideoItem>>(`/videos/${id}`);
        return res.data.data;
    },

    create: async (name: string, video: File, startTime: number, endTime: number, isPrivate: boolean, accessKey: string): Promise<VideoItem> => {
        const form = new FormData();
        form.append("name", name);
        form.append("video", video);
        form.append("startTime", startTime.toString());
        form.append("endTime", endTime.toString());
        if (isPrivate) {
            form.append("isPrivate", "true");
            if (accessKey) form.append("accessKey", accessKey);
        }
        const res = await api.post<ApiResponse<VideoItem>>("/videos", form);
        return res.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/videos/${id}`);
    },

    verifyKey: async (id: string, key: string): Promise<boolean> => {
        try {
            await api.post(`/videos/${id}/unlock`, { key });
            return true;
        } catch {
            return false;
        }
    },
};
