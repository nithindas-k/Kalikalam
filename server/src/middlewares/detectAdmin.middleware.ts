import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Admin from "../modules/admin/admin.model";
import { AuthRequest } from "./adminAuth.middleware";

export const detectAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");

            const admin = await Admin.findById(decoded.id).select("-password");

            if (admin && admin.status === "approved") {
                req.admin = admin;
            }
        } catch (error) {
         
        }
    }
    next();
};
