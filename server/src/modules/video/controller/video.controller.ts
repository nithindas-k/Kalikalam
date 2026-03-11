import { Request, Response, NextFunction } from "express";
import { IVideoController } from "../interfaces/IVideoController";
import { IVideoService } from "../interfaces/IVideoService";
import { CreateVideoDTO } from "../dto/create-video.dto";
import { UpdateVideoDTO } from "../dto/update-video.dto";
import { successResponse } from "../../../utils/response.util";
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

    private async processVideo(file: Express.Multer.File, startTime: number, endTime: number): Promise<{ video: any, thumbnail: any, tempFiles: string[] }> {
        const inputPath = file.path;
        const tempDir = path.dirname(inputPath);
        const trimmedPath = path.join(tempDir, `trimmed-${Date.now()}.mp4`);
        const thumbnailPath = path.join(tempDir, `thumbnail-${Date.now()}.jpg`);
        const tempFiles = [inputPath, trimmedPath, thumbnailPath];

        // 1. Trim if necessary
        // We trim if startTime > 0 OR if endTime is provided and is not -1
        // If endTime is 0 it means it hasn't been set properly, so we skip trimming
        const shouldTrim = (startTime > 0 || (endTime > 0 && endTime < 1000000)); // 1,000,000 is a safe upper bound for "not trimmed"

        if (shouldTrim && endTime > startTime) {
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
            // Just copy the input to trimmed path for consistent uploading logic
            fs.copyFileSync(inputPath, trimmedPath);
        }

        // 2. Generate Thumbnail
        await new Promise((resolve, reject) => {
            ffmpeg(trimmedPath)
                .screenshots({
                    timestamps: [Math.max(0, startTime + 1)],
                    filename: path.basename(thumbnailPath),
                    folder: tempDir,
                    size: '640x360'
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

        return { video: videoUpload, thumbnail: thumbnailUpload, tempFiles };
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        let tempFiles: string[] = [];
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

            const processed = await this.processVideo(req.file, startTime, endTime);
            tempFiles = processed.tempFiles;

            const dto: CreateVideoDTO = {
                name: req.body.name,
                videoUrl: processed.video.secure_url,
                videoPublicId: processed.video.public_id,
                thumbnailUrl: processed.thumbnail.secure_url,
                thumbnailPublicId: processed.thumbnail.public_id,
                creatorId: creatorId,
                isPrivate: req.body.isPrivate === "true",
                accessKey: req.body.accessKey,
            };

            const data = await this.service.createVideo(dto);
            res.status(201).json(successResponse("Video created successfully", data));

        } catch (error) {
            next(error);
        } finally {
            tempFiles.forEach(f => {
                if (fs.existsSync(f)) fs.unlinkSync(f);
            });
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
        let tempFiles: string[] = [];
        try {
            const creatorId = req.headers["x-creator-id"] as string;
            if (!creatorId) {
                res.status(401).json({ success: false, message: "Identification missing" });
                return;
            }

            const dto: UpdateVideoDTO = {};
            if (req.body.name) dto.name = req.body.name;
            if (req.body.isPrivate !== undefined) dto.isPrivate = req.body.isPrivate === "true";
            if (req.body.accessKey) dto.accessKey = req.body.accessKey;

            if (req.file) {
                const startTime = parseFloat(req.body.startTime) || 0;
                const endTime = parseFloat(req.body.endTime) || 0;
                const processed = await this.processVideo(req.file, startTime, endTime);
                tempFiles = processed.tempFiles;

                dto.videoUrl = processed.video.secure_url;
                dto.videoPublicId = processed.video.public_id;
                dto.thumbnailUrl = processed.thumbnail.secure_url;
                dto.thumbnailPublicId = processed.thumbnail.public_id;
            }

            const data = await this.service.updateVideo(req.params.id, dto, creatorId);
            res.status(200).json(successResponse("Video updated", data));
        } catch (error) {
            next(error);
        } finally {
            tempFiles.forEach(f => {
                if (fs.existsSync(f)) fs.unlinkSync(f);
            });
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
