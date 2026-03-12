import cloudinary from "../../../config/cloudinary";
import { CreateVideoDTO } from "../dto/create-video.dto";
import { UpdateVideoDTO } from "../dto/update-video.dto";
import { VideoResponseDTO } from "../dto/video-response.dto";
import { IVideoRepository } from "../interfaces/IVideoRepository";
import { IVideoService } from "../interfaces/IVideoService";
import { VideoMapper } from "../mapper/video.mapper";
import { MESSAGES } from "../../../constants/messages";

export class VideoService implements IVideoService {
    constructor(private readonly repo: IVideoRepository) { }

    async getAllVideos(): Promise<VideoResponseDTO[]> {
        const docs = await this.repo.findAll();
        return VideoMapper.toResponseList(docs);
    }

    async getVideoById(id: string): Promise<VideoResponseDTO> {
        const doc = await this.repo.findById(id);
        if (!doc) throw Object.assign(new Error("Video not found"), { status: 404 });
        return VideoMapper.toResponse(doc);
    }

    async createVideo(dto: CreateVideoDTO): Promise<VideoResponseDTO> {
        const doc = await this.repo.create(dto);
        return VideoMapper.toResponse(doc);
    }

    async updateVideo(id: string, dto: UpdateVideoDTO, creatorId: string, isAdmin?: boolean): Promise<VideoResponseDTO> {
        const existing = await this.repo.findById(id);
        if (!existing) throw Object.assign(new Error("Video not found"), { status: 404 });


        if (!isAdmin && existing.creatorId !== creatorId) {
            throw Object.assign(new Error("You do not have permission to edit this"), { status: 403 });
        }


        if (dto.videoPublicId && dto.videoPublicId !== existing.videoPublicId) {
            await cloudinary.uploader.destroy(existing.videoPublicId, { resource_type: "video" });
            if (existing.thumbnailPublicId) {
                await cloudinary.uploader.destroy(existing.thumbnailPublicId);
            }
        }

        const updated = await this.repo.update(id, dto);
        if (!updated) throw Object.assign(new Error("Video not found"), { status: 404 });
        return VideoMapper.toResponse(updated);
    }

    async deleteVideo(id: string, creatorId: string, isAdmin?: boolean): Promise<boolean> {
        const doc = await this.repo.findById(id);
        if (!doc) throw Object.assign(new Error("Video not found"), { status: 404 });

        if (!isAdmin && doc.creatorId !== creatorId) {
            throw Object.assign(new Error("You do not have permission to delete this"), { status: 403 });
        }

        await cloudinary.uploader.destroy(doc.videoPublicId, { resource_type: "video" });
        if (doc.thumbnailPublicId) {
            await cloudinary.uploader.destroy(doc.thumbnailPublicId);
        }

        await this.repo.delete(id);
        return true;
    }

    async verifyKey(id: string, key: string): Promise<boolean> {
        const doc = await this.repo.findById(id);
        if (!doc) throw Object.assign(new Error("Video not found"), { status: 404 });

        if (!doc.isPrivate) return true;
        return doc.accessKey === key;
    }
}
