import { Schema, model, Document } from "mongoose";

export interface IVideoDocument extends Document {
    name: string;
    videoUrl: string;
    videoPublicId: string;
    thumbnailUrl?: string;
    creatorId?: string;
    isPrivate: boolean;
    accessKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

const VideoSchema = new Schema<IVideoDocument>(
    {
        name: { type: String, required: true, trim: true },
        videoUrl: { type: String, required: true },
        videoPublicId: { type: String, required: true },
        thumbnailUrl: { type: String },
        creatorId: { type: String },
        isPrivate: { type: Boolean, default: false },
        accessKey: { type: String },
    },
    { timestamps: true }
);

export const VideoModel = model<IVideoDocument>("Video", VideoSchema);
