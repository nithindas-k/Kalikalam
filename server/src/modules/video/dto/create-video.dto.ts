export interface CreateVideoDTO {
    name: string;
    videoUrl: string;
    videoPublicId: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
    creatorId: string;
    isPrivate: boolean;
    accessKey?: string;
}
