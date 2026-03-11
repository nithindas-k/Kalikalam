import { IVideoRepository } from "../interfaces/IVideoRepository";
import { VideoModel, IVideoDocument } from "../entity/video.entity";

export class VideoRepository implements IVideoRepository {
    async findAll(): Promise<IVideoDocument[]> {
        return await VideoModel.find().sort({ createdAt: -1 });
    }

    async findById(id: string): Promise<IVideoDocument | null> {
        return await VideoModel.findById(id);
    }

    async create(data: Partial<IVideoDocument>): Promise<IVideoDocument> {
        const video = new VideoModel(data);
        return await video.save();
    }

    async update(id: string, data: Partial<IVideoDocument>): Promise<IVideoDocument | null> {
        return await VideoModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<IVideoDocument | null> {
        return await VideoModel.findByIdAndDelete(id);
    }
}
