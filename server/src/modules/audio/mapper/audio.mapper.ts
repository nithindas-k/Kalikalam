import { IAudioDocument } from "../entity/audio.entity";
import { AudioResponseDTO } from "../dto/audio-response.dto";

export class AudioMapper {
    static toResponse(doc: IAudioDocument): AudioResponseDTO {
        return {
            id: String(doc._id),
            name: doc.name,
            imageUrl: doc.imageUrl,
            audioUrl: doc.audioUrl,
            creatorId: doc.creatorId || "",
            isPrivate: doc.isPrivate,
            accessKey: doc.accessKey,
            createdAt: doc.createdAt.toISOString(),
        };
    }

    static toResponseList(docs: IAudioDocument[]): AudioResponseDTO[] {
        return docs.map((doc) => AudioMapper.toResponse(doc));
    }
}
