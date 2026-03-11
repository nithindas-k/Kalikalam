import { IVideoDocument } from "../entity/video.entity";

export interface IVideoRepository {
    findAll(): Promise<IVideoDocument[]>;
    findById(id: string): Promise<IVideoDocument | null>;
    create(data: Partial<IVideoDocument>): Promise<IVideoDocument>;
    update(id: string, data: Partial<IVideoDocument>): Promise<IVideoDocument | null>;
    delete(id: string): Promise<IVideoDocument | null>;
}
