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
import { AuthRequest } from "../../../middlewares/adminAuth.middleware";

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

    private async processVideo(
        videoFile: Express.Multer.File,
        startTime: number,
        endTime: number,
        thumbnailFile?: Express.Multer.File
    ): Promise<{ video: any, thumbnail: any, tempFiles: string[] }> {
        const inputPath = videoFile.path;
        const tempDir = path.dirname(inputPath);
        const trimmedPath = path.join(tempDir, `trimmed-${Date.now()}.mp4`);
        const tempFiles = [inputPath, trimmedPath];

        // 1. Trim if necessary
        const shouldTrim = (startTime > 0 || (endTime > 0 && endTime < 1000000));

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
            fs.copyFileSync(inputPath, trimmedPath);
        }

        let thumbnailUpload;

        if (thumbnailFile) {
            // Use User Provided Thumbnail
            tempFiles.push(thumbnailFile.path);
            thumbnailUpload = await cloudinary.uploader.upload(thumbnailFile.path, {
                folder: "kalikalam/video_thumbnails",
                resource_type: "image"
            });
        } else {
            // Generate Thumbnail from Video
            const thumbnailPath = path.join(tempDir, `thumbnail-${Date.now()}.jpg`);
            tempFiles.push(thumbnailPath);

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

            thumbnailUpload = await cloudinary.uploader.upload(thumbnailPath, {
                folder: "kalikalam/video_thumbnails",
                resource_type: "image"
            });
        }

        // 3. Upload Video
        const videoUpload = await cloudinary.uploader.upload(trimmedPath, {
            folder: "kalikalam/videos",
            resource_type: "video"
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

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const videoFile = files?.video?.[0];
            const thumbnailFile = files?.thumbnail?.[0];

            if (!videoFile || !req.body.name) {
                res.status(400).json({ success: false, message: "Video and name are required." });
                return;
            }

            const startTime = parseFloat(req.body.startTime) || 0;
            const endTime = parseFloat(req.body.endTime) || 0;

            const processed = await this.processVideo(videoFile, startTime, endTime, thumbnailFile);
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

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const videoFile = files?.video?.[0];
            const thumbnailFile = files?.thumbnail?.[0];

            const dto: UpdateVideoDTO = {};
            if (req.body.name) dto.name = req.body.name;
            if (req.body.isPrivate !== undefined) dto.isPrivate = req.body.isPrivate === "true";
            if (req.body.accessKey) dto.accessKey = req.body.accessKey;

            if (videoFile) {
                const startTime = parseFloat(req.body.startTime) || 0;
                const endTime = parseFloat(req.body.endTime) || 0;
                const processed = await this.processVideo(videoFile, startTime, endTime, thumbnailFile);
                tempFiles = processed.tempFiles;

                dto.videoUrl = processed.video.secure_url;
                dto.videoPublicId = processed.video.public_id;
                dto.thumbnailUrl = processed.thumbnail.secure_url;
                dto.thumbnailPublicId = processed.thumbnail.public_id;
            } else if (thumbnailFile) {
                // If only thumbnail is updated
                tempFiles.push(thumbnailFile.path);
                const thumbnailUpload = await cloudinary.uploader.upload(thumbnailFile.path, {
                    folder: "kalikalam/video_thumbnails",
                    resource_type: "image"
                });
                dto.thumbnailUrl = thumbnailUpload.secure_url;
                dto.thumbnailPublicId = thumbnailUpload.public_id;
            }

            const isAdmin = !!(req as AuthRequest).admin;
            const data = await this.service.updateVideo(req.params.id, dto, creatorId, isAdmin);
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

            const isAdmin = !!(req as AuthRequest).admin;
            await this.service.deleteVideo(req.params.id, creatorId, isAdmin);
            res.status(200).json(successResponse("Video deleted", null));
        } catch (error) {
            next(error);
        }
    }
}
