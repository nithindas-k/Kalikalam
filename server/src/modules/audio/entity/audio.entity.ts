import { Schema, model, Document } from "mongoose";

export interface IAudioDocument extends Document {
    name: string;
    imageUrl: string;
    imagePublicId: string;
    audioUrl: string;
    audioPublicId: string;
    creatorId?: string;
    isPrivate: boolean;
    accessKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AudioSchema = new Schema<IAudioDocument>(
    {
        name: { type: String, required: true, trim: true },
        imageUrl: { type: String, required: true },
        imagePublicId: { type: String, required: true },
        audioUrl: { type: String, required: true },
        audioPublicId: { type: String, required: true },
        creatorId: { type: String },
        isPrivate: { type: Boolean, default: false },
        accessKey: { type: String },
    },
    { timestamps: true }
);

export const AudioModel = model<IAudioDocument>("Audio", AudioSchema);
