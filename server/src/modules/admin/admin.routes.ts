import { Router } from "express";
import { registerAdmin, loginAdmin, getPendingAdmins, updateAdminStatus, updateAdminProfile } from "./admin.controller";
import { adminAuth } from "../../middlewares/adminAuth.middleware";
import { uploadProfile } from "../../config/multer-profile";

const router = Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);


router.get("/requests", adminAuth, getPendingAdmins);
router.put("/requests/:id", adminAuth, updateAdminStatus);
router.put("/profile", adminAuth, uploadProfile, updateAdminProfile);

export default router;
