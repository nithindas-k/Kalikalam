import { Router } from "express";
import { googleLogin, updateProfile, getAllUsers } from "./auth.controller";

const router = Router();

router.get("/", getAllUsers);
router.post("/google", googleLogin);
router.put("/profile/:id", updateProfile);

export default router;
