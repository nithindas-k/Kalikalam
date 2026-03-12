import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "./admin.model";

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
        expiresIn: "30d",
    });
};

export const registerAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await Admin.create({
            email,
            password: hashedPassword,
        });

        if (admin) {
            res.status(201).json({
                _id: admin._id,
                email: admin.email,
                token: generateToken(String(admin._id)),
            });
        } else {
            res.status(400).json({ message: "Invalid admin data" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const loginAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (admin && (await bcrypt.compare(password, admin.password))) {
            res.json({
                _id: admin._id,
                email: admin.email,
                token: generateToken(String(admin._id)),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
