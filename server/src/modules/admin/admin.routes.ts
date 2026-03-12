import { Router } from "express";
import { registerAdmin, loginAdmin, getPendingAdmins, updateAdminStatus } from "./admin.controller";
import { adminAuth } from "../../middlewares/adminAuth.middleware";

const router = Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);


router.get("/requests", adminAuth, getPendingAdmins);
router.put("/requests/:id", adminAuth, updateAdminStatus);

export default router;
