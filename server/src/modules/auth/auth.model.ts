import mongoose, { Schema, Document } from "mongoose";

export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    role: "user" | "admin";
    pushSubscriptions: PushSubscription[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        image: { type: String, default: "" },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        pushSubscriptions: {
            type: [
                {
                    endpoint: String,
                    keys: {
                        p256dh: String,
                        auth: String,
                    },
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
