import { Router } from "express";
import { uploadVideoLocal } from "../../config/multer-video";
import { VideoController } from "./controller/video.controller";
import { VideoService } from "./service/video.service";
import { VideoRepository } from "./repository/video.repository";

const router = Router();

// Dependency injection wiring
const videoRepository = new VideoRepository();
const videoService = new VideoService(videoRepository);
const videoController = new VideoController(videoService);

router.get("/", (req, res, next) => videoController.getAll(req, res, next));
router.get("/:id", (req, res, next) => videoController.getById(req, res, next));
router.post("/:id/unlock", (req, res, next) => videoController.verifyKey(req, res, next));
router.post("/", uploadVideoLocal, (req, res, next) => videoController.create(req, res, next));
router.put("/:id", uploadVideoLocal, (req, res, next) => videoController.update(req, res, next));
router.delete("/:id", (req, res, next) => videoController.delete(req, res, next));

export default router;
