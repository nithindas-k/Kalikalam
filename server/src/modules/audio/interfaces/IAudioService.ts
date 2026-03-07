import { AudioResponseDTO } from "../dto/audio-response.dto";
import { CreateAudioDTO } from "../dto/create-audio.dto";
import { UpdateAudioDTO } from "../dto/update-audio.dto";

export interface IAudioService {
    getAllAudios(): Promise<AudioResponseDTO[]>;
    getAudioById(id: string): Promise<AudioResponseDTO>;
    createAudio(dto: CreateAudioDTO): Promise<AudioResponseDTO>;
    updateAudio(id: string, dto: UpdateAudioDTO, creatorId: string): Promise<AudioResponseDTO>;
    deleteAudio(id: string, creatorId: string): Promise<void>;
    verifyKey(id: string, key: string): Promise<boolean>;
}
