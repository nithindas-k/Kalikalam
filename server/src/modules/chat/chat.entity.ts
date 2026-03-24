import { Schema, model, Document } from "mongoose";

export interface IChatMessageDocument extends Document {
    senderId: string;
    senderName: string;
    senderImage: string;
    type: "text" | "image" | "audio";
    content: string;
    createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessageDocument>(
    {
        senderId: { type: String, required: true },
        senderName: { type: String, required: true, default: "Anonymous" },
        senderImage: { type: String, default: "" },
        type: { type: String, enum: ["text", "image", "audio"], required: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);


ChatMessageSchema.index({ createdAt: -1 });

export const ChatMessageModel = model<IChatMessageDocument>("ChatMessage", ChatMessageSchema);
