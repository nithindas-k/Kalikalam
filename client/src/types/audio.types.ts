export interface AudioItem {
    id: string;
    name: string;
    imageUrl: string;
    audioUrl: string;
    creatorId: string;
    isPrivate: boolean;
    createdAt: string;
}

export interface CreateAudioPayload {
    name: string;
    image: File;
    audio: File;
    isPrivate?: boolean;
    accessKey?: string;
}

export interface UpdateAudioPayload {
    name?: string;
    image?: File;
    audio?: File;
}
