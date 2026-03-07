import cloudinary from "../../../config/cloudinary";
import { CreateAudioDTO } from "../dto/create-audio.dto";
import { UpdateAudioDTO } from "../dto/update-audio.dto";
import { AudioResponseDTO } from "../dto/audio-response.dto";
import { IAudioRepository } from "../interfaces/IAudioRepository";
import { IAudioService } from "../interfaces/IAudioService";
import { AudioMapper } from "../mapper/audio.mapper";
import { MESSAGES } from "../../../constants/messages";

export class AudioService implements IAudioService {
    constructor(private readonly repo: IAudioRepository) { }

    async getAllAudios(): Promise<AudioResponseDTO[]> {
        const docs = await this.repo.findAll();
        return AudioMapper.toResponseList(docs);
    }

    async getAudioById(id: string): Promise<AudioResponseDTO> {
        const doc = await this.repo.findById(id);
        if (!doc) throw Object.assign(new Error(MESSAGES.AUDIO_NOT_FOUND), { status: 404 });
        return AudioMapper.toResponse(doc);
    }

    async createAudio(dto: CreateAudioDTO): Promise<AudioResponseDTO> {
        const doc = await this.repo.create(dto);
        return AudioMapper.toResponse(doc);
    }

    async updateAudio(id: string, dto: UpdateAudioDTO, creatorId: string): Promise<AudioResponseDTO> {
        const existing = await this.repo.findById(id);
        if (!existing) throw Object.assign(new Error(MESSAGES.AUDIO_NOT_FOUND), { status: 404 });

        // Ownership check
        if (existing.creatorId !== creatorId) {
            throw Object.assign(new Error("You do not have permission to edit this"), { status: 403 });
        }

        // Delete old Cloudinary assets if replaced
        if (dto.imagePublicId && dto.imagePublicId !== existing.imagePublicId) {
            await cloudinary.uploader.destroy(existing.imagePublicId);
        }
        if (dto.audioPublicId && dto.audioPublicId !== existing.audioPublicId) {
            await cloudinary.uploader.destroy(existing.audioPublicId, { resource_type: "video" });
        }

        const updated = await this.repo.update(id, dto);
        if (!updated) throw Object.assign(new Error(MESSAGES.AUDIO_NOT_FOUND), { status: 404 });
        return AudioMapper.toResponse(updated);
    }

    async deleteAudio(id: string, creatorId: string): Promise<void> {
        const doc = await this.repo.findById(id);
        if (!doc) throw Object.assign(new Error(MESSAGES.AUDIO_NOT_FOUND), { status: 404 });

        // Ownership check
        if (doc.creatorId !== creatorId) {
            throw Object.assign(new Error("You do not have permission to delete this"), { status: 403 });
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(doc.imagePublicId);
        await cloudinary.uploader.destroy(doc.audioPublicId, { resource_type: "video" });

        await this.repo.delete(id);
    }

    async verifyKey(id: string, key: string): Promise<boolean> {
        const doc = await this.repo.findById(id);
        if (!doc) throw Object.assign(new Error(MESSAGES.AUDIO_NOT_FOUND), { status: 404 });

        if (!doc.isPrivate) return true; // Public is always "verified"
        return doc.accessKey === key;
    }
}
