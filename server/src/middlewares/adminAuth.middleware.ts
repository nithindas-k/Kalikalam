import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Admin from "../modules/admin/admin.model";

export interface AuthRequest extends Request {
    admin?: any;
}

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");

            const admin = await Admin.findById(decoded.id).select("-password");

            if (!admin || admin.status !== "approved") {
                return res.status(401).json({ message: "Not authorized as an approved admin" });
            }

            req.admin = admin;
            next();
        } catch (error) {
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};
