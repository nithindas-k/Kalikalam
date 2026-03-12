import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
    email: string;
    password: string;
}

const adminSchema: Schema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IAdmin>("Admin", adminSchema);
