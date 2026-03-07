import { Request, Response, NextFunction } from "express";
import { IAudioController } from "../interfaces/IAudioController";
import { IAudioService } from "../interfaces/IAudioService";
import { CreateAudioDTO } from "../dto/create-audio.dto";
import { UpdateAudioDTO } from "../dto/update-audio.dto";
import { successResponse } from "../../../utils/response.util";
import { MESSAGES } from "../../../constants/messages";

export class AudioController implements IAudioController {
    constructor(private readonly service: IAudioService) { }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await this.service.getAllAudios();
            res.status(200).json(successResponse(MESSAGES.AUDIO_FETCHED_ALL, data));
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await this.service.getAudioById(req.params.id);
            res.status(200).json(successResponse(MESSAGES.AUDIO_FETCHED_ONE, data));
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!req.body.name || !files?.["image"]?.[0] || !files?.["audio"]?.[0]) {
                res.status(400).json({ success: false, message: MESSAGES.VALIDATION_ERROR });
                return;
            }

            const dto: CreateAudioDTO = {
                name: req.body.name,
                imageUrl: files["image"][0].path,
                imagePublicId: files["image"][0].filename,
                audioUrl: files["audio"][0].path,
                audioPublicId: files["audio"][0].filename,
            };

            const data = await this.service.createAudio(dto);
            res.status(201).json(successResponse(MESSAGES.AUDIO_CREATED, data));
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            const dto: UpdateAudioDTO = {};

            if (req.body.name) dto.name = req.body.name;
            if (files?.["image"]?.[0]) {
                dto.imageUrl = files["image"][0].path;
                dto.imagePublicId = files["image"][0].filename;
            }
            if (files?.["audio"]?.[0]) {
                dto.audioUrl = files["audio"][0].path;
                dto.audioPublicId = files["audio"][0].filename;
            }

            const data = await this.service.updateAudio(req.params.id, dto);
            res.status(200).json(successResponse(MESSAGES.AUDIO_UPDATED, data));
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await this.service.deleteAudio(req.params.id);
            res.status(200).json(successResponse(MESSAGES.AUDIO_DELETED, null));
        } catch (error) {
            next(error);
        }
    }
}
