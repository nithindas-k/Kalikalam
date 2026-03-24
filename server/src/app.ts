import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db";
import audioRoutes from "./modules/audio/audio.routes";
import videoRoutes from "./modules/video/video.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { API_ROUTES } from "./constants/routes";
import { ChatMessageModel } from "./modules/chat/chat.entity";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Creator-Id"],
        credentials: true,
    })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(`${API_ROUTES.BASE}${API_ROUTES.AUDIOS}`, audioRoutes);
app.use(`${API_ROUTES.BASE}${API_ROUTES.VIDEOS}`, videoRoutes);
app.use(`${API_ROUTES.BASE}${API_ROUTES.ADMIN}`, adminRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

// ─── HTTP + Socket.io server ─────────────────────────────────────────────────
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: true,   // allow all origins — no cookie auth needed for chat
        methods: ["GET", "POST"],
    },
});

// ─── Chat Message interface ───────────────────────────────────────────────────
interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderImage: string;
    type: "text" | "image" | "audio";
    content: string;
    timestamp: string;
}

// ─── Socket handlers ──────────────────────────────────────────────────────────
io.on("connection", async (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // Send last 50 messages from DB to the newly connected client
    try {
        const history = await ChatMessageModel
            .find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Reverse so oldest is first
        const formatted: ChatMessage[] = history.reverse().map((m) => ({
            id: (m._id as object).toString(),
            senderId: m.senderId,
            senderName: m.senderName,
            senderImage: m.senderImage,
            type: m.type,
            content: m.content,
            timestamp: (m.createdAt as Date).toISOString(),
        }));

        socket.emit("chat:history", formatted);
    } catch (err) {
        console.error("Failed to load chat history:", err);
        socket.emit("chat:history", []);
    }

    // Broadcast online user count
    io.emit("chat:online", io.engine.clientsCount);

    // Handle incoming messages
    socket.on("chat:send", async (msg: Omit<ChatMessage, "id" | "timestamp">) => {
        console.log(`💬 Message from ${msg.senderName}: [${msg.type}]`);
        try {
            // Persist to MongoDB
            const saved = await ChatMessageModel.create({
                senderId: msg.senderId,
                senderName: msg.senderName,
                senderImage: msg.senderImage,
                type: msg.type,
                content: msg.content,
            });

            const message: ChatMessage = {
                id: saved._id.toString(),
                senderId: saved.senderId,
                senderName: saved.senderName,
                senderImage: saved.senderImage,
                type: saved.type,
                content: saved.content,
                timestamp: saved.createdAt.toISOString(),
            };

            // Broadcast to ALL clients
            io.emit("chat:message", message);
        } catch (err) {
            console.error("Failed to save message:", err);
        }
    });

    // Typing indicator
    socket.on("chat:typing", (data: { senderName: string; isTyping: boolean }) => {
        socket.broadcast.emit("chat:typing", data);
    });

    socket.on("disconnect", () => {
        console.log(`🔴 Socket disconnected: ${socket.id}`);
        io.emit("chat:online", io.engine.clientsCount);
    });
});

// ─── Start server ─────────────────────────────────────────────────────────────
connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`💬 Socket.io ready`);
    });
});
