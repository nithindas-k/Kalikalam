import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db";
import audioRoutes from "./modules/audio/audio.routes";
import videoRoutes from "./modules/video/video.routes";
import adminRoutes from "./modules/admin/admin.routes";
import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import pushRoutes, { sendPushToAllUsers } from "./modules/push/push.routes";
import { API_ROUTES } from "./constants/routes";
import { ChatMessageModel } from "./modules/chat/chat.entity";
import { UserModel } from "./modules/auth/auth.model";
 
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
            // Allow your domains + local testing
            if (
                allowedOrigins.indexOf(origin) !== -1 || 
                origin.endsWith(".vercel.app") || 
                origin.endsWith(".onrender.com") ||
                origin.includes("localhost")
            ) {
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
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/push", pushRoutes);


import { upload } from "./config/multer";
app.post(`${API_ROUTES.BASE}/chat/upload`, upload, (req: any, res) => {
    const files = req.files;
    let url = "";

    if (files?.image?.[0]) {
        url = files.image[0].path;
    } else if (files?.audio?.[0]) {
        url = files.audio[0].path;
    } else {
        return res.status(400).json({ error: "No files uploaded or invalid field names." });
    }

    res.json({ url });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: true,   
        methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 2e7, 
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

const voiceParticipants = new Map<string, { id: string; name: string; avatar: string; socketId: string; isSpeaking: boolean }>();

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

       
        const users = await UserModel.find({}, "name image");
        socket.emit("chat:users", users.map(u => ({ name: u.name, image: u.image || "" })));

    } catch (err) {
        console.error("Failed to load chat history:", err);
        socket.emit("chat:history", []);
    }

  
    io.emit("chat:online", io.engine.clientsCount);

    
    socket.emit("voice:participants", Array.from(voiceParticipants.values()));


    socket.on("chat:send", async (msg: Omit<ChatMessage, "id" | "timestamp">) => {
        console.log(`💬 Message from ${msg.senderName}: [${msg.type}]`);

        
        const message: ChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            senderId: msg.senderId || "unknown",
            senderName: msg.senderName || "Anonymous",
            senderImage: msg.senderImage || "",
            type: msg.type,
            content: msg.content,
            timestamp: new Date().toISOString(),
        };

        
        io.emit("chat:message", message);

        try {
            
            await ChatMessageModel.create({
                senderId: message.senderId,
                senderName: message.senderName,
                senderImage: message.senderImage,
                type: message.type,
                content: message.content,
            });


            sendPushToAllUsers({
                title: message.senderName,
                body: message.type === "text" ? message.content : `[${message.type}]`,
                icon: message.senderImage || "/favicon.ico",
                data: { url: "/chat" }
            }, message.senderId);
        } catch (err) {
            console.error("🚨 Failed to save chat message to MongoDB:", err);
        }
    });

    
    socket.on("voice:join", (user: { id: string; name: string; avatar: string }) => {
        console.log(`🎙️ User joined voice: ${user.name} (${socket.id})`);
        
       
        voiceParticipants.set(socket.id, {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            socketId: socket.id,
            isSpeaking: false
        });

       
        const others = Array.from(voiceParticipants.values()).filter(p => p.socketId !== socket.id);
        io.emit("voice:participants", Array.from(voiceParticipants.values()));

        // 3. Send PUSH notification to everyone about the new joiner
        sendPushToAllUsers({
            title: "Voice Chat",
            body: `${user.name} joined the voice room!`,
            icon: user.avatar || "/favicon.ico",
            data: { url: "/voice" }
        }, user.id);

        // 2. Broadcast to everyone else that a new guy joined so they create RTCPeerConnection Offer
        socket.broadcast.emit("voice:user-joined", {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            socketId: socket.id
        });
    });

    socket.on("voice:signal", (data: { to: string; signal: any; from: string }) => {
        // Forward SDP/ICE offer candidates flawlessly securely
        socket.to(data.to).emit("voice:signal", {
            signal: data.signal,
            from: socket.id // Ensure we send the forwarding socket ID
        });
    });

    socket.on("voice:speaking", (data: { isSpeaking: boolean }) => {
        const participant = voiceParticipants.get(socket.id);
        if (participant) {
            participant.isSpeaking = data.isSpeaking;
            io.emit("voice:participants", Array.from(voiceParticipants.values()));
        }
    });

    socket.on("voice:leave", () => {
        if (voiceParticipants.has(socket.id)) {
            console.log(`🎙️ User left voice: ${socket.id}`);
            voiceParticipants.delete(socket.id);
            io.emit("voice:participants", Array.from(voiceParticipants.values()));
            socket.broadcast.emit("voice:user-left", { socketId: socket.id });
        }
    });

    // Typing indicator
    socket.on("chat:typing", (data: { senderName: string; isTyping: boolean }) => {
        socket.broadcast.emit("chat:typing", data);
    });

   
    socket.on("chat:delete", async (data: { messageId: string; senderId: string }) => {
        console.log(`🗑️ Delete Message Request: ${data.messageId} by ${data.senderId}`);
        try {
          
            await ChatMessageModel.deleteOne({ 
                $or: [{ _id: data.messageId }, { id: data.messageId }] 
            });
          
            io.emit("chat:delete", { messageId: data.messageId });
        } catch (err) {
            console.error("🚨 Failed to delete chat message from MongoDB:", err);
        }
    });

 
    const updateOnlineUsers = () => {
        const users: string[] = [];
        for (const [id, s] of io.sockets.sockets) {
           
            const name = (s as any).userName || s.id.slice(0, 4);
            if (!users.includes(name)) users.push(name);
        }
        io.emit("chat:online", { count: io.engine.clientsCount, users });
    };

    
    (socket as any).userName = (socket.handshake.query?.userName as string) || "User_" + socket.id.slice(0, 4);
    updateOnlineUsers();

    socket.on("disconnect", () => {
        console.log(`🔴 Socket disconnected: ${socket.id}`);
        
        if (voiceParticipants.has(socket.id)) {
            console.log(`🎙️ User disconnected from voice: ${socket.id}`);
            voiceParticipants.delete(socket.id);
            io.emit("voice:participants", Array.from(voiceParticipants.values()));
            socket.broadcast.emit("voice:user-left", { socketId: socket.id });
        }

        updateOnlineUsers();
    });
});


connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`💬 Socket.io ready`);
    });
});
