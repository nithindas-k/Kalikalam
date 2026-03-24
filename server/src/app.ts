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
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// In-memory chat message store (last 50 messages)
interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderImage: string;
    type: "text" | "image" | "audio";
    content: string;
    timestamp: string;
}

const chatHistory: ChatMessage[] = [];
const MAX_HISTORY = 50;

io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // Send message history to the newly connected client
    socket.emit("chat:history", chatHistory);

    // Broadcast online user count
    io.emit("chat:online", io.engine.clientsCount);

    // Handle incoming messages
    socket.on("chat:send", (msg: Omit<ChatMessage, "id" | "timestamp">) => {
        console.log(`💬 Message from ${msg.senderName}: [${msg.type}]`);
        const message: ChatMessage = {
            ...msg,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: new Date().toISOString(),
        };

        // Store in history
        chatHistory.push(message);
        if (chatHistory.length > MAX_HISTORY) {
            chatHistory.shift();
        }

        // Broadcast to ALL clients (including sender so they see it confirmed)
        io.emit("chat:message", message);
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
