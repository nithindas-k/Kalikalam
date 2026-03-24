import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { UserModel } from "./auth.model";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
    const { credential, accessToken } = req.body;

    if (!credential && !accessToken) {
        return res.status(400).json({ error: "Google token is required" });
    }

    try {
        let name = "";
        let email = "";
        let picture = "";

        if (credential) {
            // 1a. Verify ID Token
            const ticket = await client.verifyIdToken({
                idToken: credential as string,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) return res.status(400).json({ error: "Invalid token" });
            name = payload.name || "";
            email = payload.email;
            picture = payload.picture || "";
        } else if (accessToken) {
            // 1b. Verify Access Token via UserInfo API
            const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
            const payload = await googleRes.json() as { email?: string; name?: string; picture?: string };
            console.log("🔍 Google Login Access Token Payload:", payload); // 🔬 DEBUG LOG
            
            if (!payload.email) return res.status(400).json({ error: "Invalid access token" });
            name = payload.name || "";
            email = payload.email;
            picture = payload.picture || "";
        }

        if (!email) {
            return res.status(400).json({ error: "No email payload" });
        }

        // 2. Find or Create User in DB
        let user = await UserModel.findOne({ email });

        if (!user) {
            user = await UserModel.create({
                name: name || "Google User",
                email: email,
                image: picture || "",
                role: "user",
            });
        } else if (picture && user.image !== picture) {
            // Update photo always if changed from Google or legacy Empty
            user.image = picture;
            await user.save();
        }

        // 3. Generate JWT Token Setup
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "kalikalam@123",
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("🚨 Google Auth Error:", error);
        res.status(500).json({ error: "Authentication failed. Try again." });
    }
};

// ─── Update Profile Controller ──────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, image } = req.body;

    try {
        const user = await UserModel.findById(id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (name) user.name = name;
        if (image) user.image = image;

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
    }
};
