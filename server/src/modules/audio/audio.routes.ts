import { Router } from "express";
import { upload } from "../../config/multer";
import { AudioController } from "./controller/audio.controller";
import { AudioService } from "./service/audio.service";
import { AudioRepository } from "./repository/audio.repository";
import { detectAdmin } from "../../middlewares/detectAdmin.middleware";

const router = Router();

const audioRepository = new AudioRepository();
const audioService = new AudioService(audioRepository);
const audioController = new AudioController(audioService);

router.get("/", (req, res, next) => audioController.getAll(req, res, next));
router.get("/:id", (req, res, next) => audioController.getById(req, res, next));
router.post("/:id/unlock", (req, res, next) => audioController.verifyKey(req, res, next));
router.post("/", detectAdmin, upload, (req, res, next) => audioController.create(req, res, next));
router.put("/:id", detectAdmin, upload, (req, res, next) => audioController.update(req, res, next));
router.delete("/:id", detectAdmin, (req, res, next) => audioController.delete(req, res, next));

export default router;
