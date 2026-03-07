import { IAudioDocument } from "../entity/audio.entity";
import { CreateAudioDTO } from "../dto/create-audio.dto";
import { UpdateAudioDTO } from "../dto/update-audio.dto";

export interface IAudioRepository {
    findAll(): Promise<IAudioDocument[]>;
    findById(id: string): Promise<IAudioDocument | null>;
    create(dto: CreateAudioDTO): Promise<IAudioDocument>;
    update(id: string, dto: UpdateAudioDTO): Promise<IAudioDocument | null>;
    delete(id: string): Promise<IAudioDocument | null>;
}
