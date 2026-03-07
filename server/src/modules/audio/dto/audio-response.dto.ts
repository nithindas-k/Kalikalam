export interface AudioResponseDTO {
    id: string;
    name: string;
    imageUrl: string;
    audioUrl: string;
    creatorId: string;
    isPrivate: boolean;
    accessKey?: string;
    createdAt: string;
}
