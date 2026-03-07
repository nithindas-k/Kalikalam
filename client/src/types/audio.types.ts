export interface AudioItem {
    id: string;
    name: string;
    imageUrl: string;
    audioUrl: string;
    createdAt: string;
}

export interface CreateAudioPayload {
    name: string;
    image: File;
    audio: File;
}

export interface UpdateAudioPayload {
    name?: string;
    image?: File;
    audio?: File;
}
