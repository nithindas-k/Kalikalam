import { Request, Response, NextFunction } from "express";
import { IVideoController } from "../interfaces/IVideoController";
import { IVideoService } from "../interfaces/IVideoService";
import { CreateVideoDTO } from "../dto/create-video.dto";
import { UpdateVideoDTO } from "../dto/update-video.dto";
import { successResponse } from "../../../utils/response.util";
import { MESSAGES } from "../../../constants/messages";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "@ffmpeg-installer/ffmpeg";
import path from "path";
import fs from "fs";
import cloudinary from "../../../config/cloudinary";

ffmpeg.setFfmpegPath(ffmpegStatic.path);

export class VideoController implements IVideoController {
    constructor(private readonly service: IVideoService) { }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await this.service.getAllVideos();
            res.status(200).json(successResponse("Videos fetched successfully", data));
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await this.service.getVideoById(req.params.id);
            res.status(200).json(successResponse("Video fetched successfully", data));
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        let inputPath = "";
        let trimmedPath = "";
        let thumbnailPath = "";

        try {
            const creatorId = req.headers["x-creator-id"] as string;
            if (!creatorId) {
                res.status(401).json({ success: false, message: "Identification missing" });
                return;
            }

            if (!req.file || !req.body.name) {
                res.status(400).json({ success: false, message: "Video and name are required." });
                return;
            }

            const startTime = parseFloat(req.body.startTime) || 0;
            const endTime = parseFloat(req.body.endTime) || 0;

            inputPath = req.file.path;
            const tempDir = path.dirname(inputPath);
            trimmedPath = path.join(tempDir, `trimmed-${Date.now()}.mp4`);
            thumbnailPath = path.join(tempDir, `thumbnail-${Date.now()}.jpg`);

            if (endTime > startTime && endTime > 0) {
                await new Promise((resolve, reject) => {
                    ffmpeg(inputPath)
                        .setStartTime(startTime)
                        .setDuration(endTime - startTime)
                        .output(trimmedPath)
                        .on("end", resolve)
                        .on("error", reject)
                        .run();
                });
            } else {
                trimmedPath = inputPath; 
            }

            await new Promise((resolve, reject) => {
                ffmpeg(trimmedPath)
                    .screenshots({
                        timestamps: ['1'], // take screenshot at 1 second mark
                        filename: path.basename(thumbnailPath),
                        folder: tempDir,
                        size: '500x500'
                    })
                    .on("end", resolve)
                    .on("error", reject);
            });

            // 3. Upload to Cloudinary
            const videoUpload = await cloudinary.uploader.upload(trimmedPath, {
                folder: "kalikalam/videos",
                resource_type: "video"
            });
            const thumbnailUpload = await cloudinary.uploader.upload(thumbnailPath, {
                folder: "kalikalam/video_thumbnails",
                resource_type: "image"
            });

            // 4. Clean up local files
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (trimmedPath !== inputPath && fs.existsSync(trimmedPath)) fs.unlinkSync(trimmedPath);
            if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

            // 5. Save to DB
            const dto: CreateVideoDTO = {
                name: req.body.name,
                videoUrl: videoUpload.secure_url,
                videoPublicId: videoUpload.public_id,
                thumbnailUrl: thumbnailUpload.secure_url,
                creatorId: creatorId,
                isPrivate: req.body.isPrivate === "true",
                accessKey: req.body.accessKey,
            };

            const data = await this.service.createVideo(dto);
            res.status(201).json(successResponse("Video created successfully", data));

        } catch (error) {
            // Cleanup on error
            if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (trimmedPath && trimmedPath !== inputPath && fs.existsSync(trimmedPath)) fs.unlinkSync(trimmedPath);
            if (thumbnailPath && fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

            next(error);
        }
    }

    async verifyKey(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { key } = req.body;
            const isValid = await this.service.verifyKey(id, key);

            if (isValid) {
                res.status(200).json(successResponse("Key verified successfully", { unlocked: true }));
            } else {
                res.status(403).json({ success: false, message: "Invalid access key" });
            }
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const creatorId = req.headers["x-creator-id"] as string;
            if (!creatorId) {
                res.status(401).json({ success: false, message: "Identification missing" });
                return;
            }

            const dto: UpdateVideoDTO = {};
            if (req.body.name) dto.name = req.body.name;
            // Not making video updateable for simplicity, but handled via dto if needed

            const data = await this.service.updateVideo(req.params.id, dto, creatorId);
            res.status(200).json(successResponse("Video updated", data));
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const creatorId = req.headers["x-creator-id"] as string;
            if (!creatorId) {
                res.status(401).json({ success: false, message: "Identification missing" });
                return;
            }

            await this.service.deleteVideo(req.params.id, creatorId);
            res.status(200).json(successResponse("Video deleted", null));
        } catch (error) {
            next(error);
        }
    }
}
