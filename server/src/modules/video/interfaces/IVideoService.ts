import { CreateVideoDTO } from "../dto/create-video.dto";
import { UpdateVideoDTO } from "../dto/update-video.dto";

export interface IVideoService {
    getAllVideos(): Promise<any>;
    getVideoById(id: string): Promise<any>;
    createVideo(data: CreateVideoDTO): Promise<any>;
    updateVideo(id: string, data: UpdateVideoDTO, creatorId: string): Promise<any>;
    deleteVideo(id: string, creatorId: string): Promise<boolean>;
    verifyKey(id: string, key: string): Promise<boolean>;
}
