export interface CreateAudioDTO {
    name: string;
    imageUrl: string;
    imagePublicId: string;
    audioUrl: string;
    audioPublicId: string;
    creatorId: string;
    isPrivate: boolean;
    accessKey?: string;
}
