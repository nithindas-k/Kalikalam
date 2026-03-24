import { Router, Request, Response } from "express";
import webpush from "web-push";
import { UserModel } from "../auth/auth.model";

const router = Router();

// Initialize VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_CONTACT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// GET /api/push/vapid-public-key - returns the public key to the client
router.get("/vapid-public-key", (_req: Request, res: Response) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe - saves a push subscription for this user
router.post("/subscribe", async (req: Request, res: Response) => {
    const { userId, subscription } = req.body;
    if (!userId || !subscription) {
        res.status(400).json({ error: "userId and subscription are required" });
        return;
    }
    try {
        await UserModel.updateOne(
            { _id: userId, "pushSubscriptions.endpoint": { $ne: subscription.endpoint } },
            { $push: { pushSubscriptions: subscription } }
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("Error saving push subscription:", err);
        res.status(500).json({ error: "Failed to save subscription" });
    }
});

// Internal helper - exported so app.ts can use it
export async function sendPushToAllUsers(payload: object, exceptUserId?: string) {
    try {
        const query = exceptUserId ? { _id: { $ne: exceptUserId }, "pushSubscriptions.0": { $exists: true } } : { "pushSubscriptions.0": { $exists: true } };
        const users = await UserModel.find(query).select("pushSubscriptions");
        const message = JSON.stringify(payload);

        for (const user of users) {
            for (const sub of user.pushSubscriptions) {
                try {
                    await webpush.sendNotification(sub as any, message);
                } catch (err: any) {
                    // If subscription expired (410), remove it
                    if (err.statusCode === 410) {
                        await UserModel.updateOne({ _id: user._id }, { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } });
                    }
                }
            }
        }
    } catch (err) {
        console.error("Push broadcast error:", err);
    }
}

export default router;
