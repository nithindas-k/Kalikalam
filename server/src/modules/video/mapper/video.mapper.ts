import { IVideoDocument } from "../entity/video.entity";
import { VideoResponseDTO } from "../dto/video-response.dto";

export class VideoMapper {
    static toResponse(doc: IVideoDocument): VideoResponseDTO {
        return {
            id: String(doc._id),
            name: doc.name,
            videoUrl: doc.videoUrl,
            thumbnailUrl: doc.thumbnailUrl,
            creatorId: doc.creatorId || "",
            isPrivate: doc.isPrivate,
            accessKey: doc.accessKey,
            createdAt: doc.createdAt.toISOString(),
        };
    }

    static toResponseList(docs: IVideoDocument[]): VideoResponseDTO[] {
        return docs.map((doc) => VideoMapper.toResponse(doc));
    }
}
