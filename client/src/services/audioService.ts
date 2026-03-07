import axios from "axios";
import { getDeviceId } from "@/utils/device";
import type { AudioItem, CreateAudioPayload, UpdateAudioPayload } from "@/types/audio.types";

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

export const audioService = {
    getAll: async (): Promise<AudioItem[]> => {
        const res = await api.get<ApiResponse<AudioItem[]>>("/audios");
        return res.data.data;
    },

    getById: async (id: string): Promise<AudioItem> => {
        const res = await api.get<ApiResponse<AudioItem>>(`/audios/${id}`);
        return res.data.data;
    },

    create: async (payload: CreateAudioPayload): Promise<AudioItem> => {
        const form = new FormData();
        form.append("name", payload.name);
        form.append("image", payload.image);
        form.append("audio", payload.audio);
        const res = await api.post<ApiResponse<AudioItem>>("/audios", form);
        return res.data.data;
    },

    update: async (id: string, payload: UpdateAudioPayload): Promise<AudioItem> => {
        const form = new FormData();
        if (payload.name) form.append("name", payload.name);
        if (payload.image) form.append("image", payload.image);
        if (payload.audio) form.append("audio", payload.audio);
        const res = await api.put<ApiResponse<AudioItem>>(`/audios/${id}`, form);
        return res.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/audios/${id}`);
    },
};
