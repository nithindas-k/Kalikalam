import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req: Express.Request, file: Express.Multer.File) => {
        if (file.fieldname === "image") {
            return {
                folder: "kalikalam/images",
                allowed_formats: ["jpg", "jpeg", "png", "webp"],
                transformation: [{ width: 500, height: 500, crop: "fill" }],
            };
        }
        return {
            folder: "kalikalam/audios",
            resource_type: "video",
            allowed_formats: ["mp3", "wav", "ogg", "m4a"],
        };
    },
} as any);

export const upload = multer({ storage }).fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
]);
