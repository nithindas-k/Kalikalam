import { AudioModel, IAudioDocument } from "../entity/audio.entity";
import { CreateAudioDTO } from "../dto/create-audio.dto";
import { UpdateAudioDTO } from "../dto/update-audio.dto";
import { IAudioRepository } from "../interfaces/IAudioRepository";

export class AudioRepository implements IAudioRepository {
    async findAll(): Promise<IAudioDocument[]> {
        return AudioModel.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IAudioDocument | null> {
        return AudioModel.findById(id);
    }

    async create(dto: CreateAudioDTO): Promise<IAudioDocument> {
        return AudioModel.create(dto);
    }

    async update(id: string, dto: UpdateAudioDTO): Promise<IAudioDocument | null> {
        return AudioModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    }

    async delete(id: string): Promise<IAudioDocument | null> {
        return AudioModel.findByIdAndDelete(id);
    }
}
