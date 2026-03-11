export interface UpdateVideoDTO {
    name?: string;
    videoUrl?: string;
    videoPublicId?: string;
    thumbnailUrl?: string;
    thumbnailPublicId?: string;
    isPrivate?: boolean;
    accessKey?: string;
}
