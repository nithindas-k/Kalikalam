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

        const adminCount = await Admin.countDocuments();
        const status = adminCount === 0 ? "approved" : "pending";

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await Admin.create({
            email,
            password: hashedPassword,
            status,
        });

        if (admin) {
            res.status(201).json({
                _id: admin._id,
                email: admin.email,
                status: admin.status,
                token: status === "approved" ? generateToken(String(admin._id)) : null,
                message: status === "pending" ? "Registration request sent to existing admins" : "Admin registered successfully",
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

        if (!admin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (admin.status === "pending") {
            return res.status(403).json({ message: "Your account is pending approval" });
        }

        if (admin.status === "rejected") {
            return res.status(403).json({ message: "Your account request was rejected" });
        }

        if (await bcrypt.compare(password, admin.password)) {
            res.json({
                _id: admin._id,
                email: admin.email,
                status: admin.status,
                name: admin.name,
                profileImage: admin.profileImage,
                token: generateToken(String(admin._id)),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getPendingAdmins = async (req: Request, res: Response) => {
    try {
        const pendingAdmins = await Admin.find({ status: "pending" }).select("-password");
        res.json(pendingAdmins);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateAdminStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const admin = await Admin.findByIdAndUpdate(id, { status }, { new: true });

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ message: `Admin status updated to ${status}`, admin });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateAdminProfile = async (req: any, res: Response) => {
    try {
        const { name } = req.body;
        const updateData: any = { name };

        if (req.file) {
            updateData.profileImage = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        }

        const admin = await Admin.findByIdAndUpdate(req.admin.id, updateData, { new: true }).select("-password");

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ message: "Profile updated successfully", admin });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
