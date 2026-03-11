export interface CreateVideoDTO {
    name: string;
    videoUrl: string;
    videoPublicId: string;
    thumbnailUrl?: string;
    creatorId: string;
    isPrivate: boolean;
    accessKey?: string;
}
