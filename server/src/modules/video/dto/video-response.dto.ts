export interface VideoResponseDTO {
    id: string;
    name: string;
    videoUrl: string;
    thumbnailUrl?: string;
    creatorId: string;
    isPrivate: boolean;
    accessKey?: string;
    createdAt: string;
}
