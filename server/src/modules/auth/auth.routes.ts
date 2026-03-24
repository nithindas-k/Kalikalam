import { Router } from "express";
import { googleLogin, updateProfile } from "./auth.controller";

const router = Router();

router.post("/google", googleLogin);
router.put("/profile/:id", updateProfile);

export default router;
