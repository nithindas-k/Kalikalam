import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage, TypingIndicator } from "@/types/chat.types";
import { useAuth } from "@/context/AuthContext";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:5000";

export function useChat() {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!token) return;

        const socketInstance = io(SOCKET_URL, {
            reconnection: true,
            auth: { token },
        });

        setSocket(socketInstance);

        const onHistory = (history: ChatMessage[]) => setMessages(history);
        const onMessage = (msg: ChatMessage) => {
            setMessages((prev) => {
                const isOwn = user && msg.senderId === user.id;
                if (isOwn) {
                    const optimisticIndex = prev.findIndex(m => m.id.startsWith("optimistic-") && m.content === msg.content);
                    if (optimisticIndex !== -1) {
                        const next = [...prev];
                        next[optimisticIndex] = msg;
                        return next;
                    }
                }
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };
        const onTyping = ({ senderName: name, isTyping }: TypingIndicator) => {
            setTypingUsers((prev) => {
                if (isTyping && !prev.includes(name)) return [...prev, name];
                if (!isTyping) return prev.filter((n) => n !== name);
                return prev;
            });
        };

        socketInstance.on("connect", () => {
            console.log("✅ Socket Connected successfully!");
            setConnected(true);
        });
        socketInstance.on("connect_error", (err) => {
            console.error("🚨 Socket Connection Error:", err);
        });
        socketInstance.on("disconnect", (reason) => {
            console.log("🔴 Socket Disconnected:", reason);
            setConnected(false);
        });
        
        socketInstance.on("chat:history", (h) => {
            console.log("📜 Received history:", h.length);
            onHistory(h);
        });
        socketInstance.on("chat:message", (m) => {
            console.log("💬 Received Live Message:", m);
            onMessage(m);
        });
        socketInstance.on("chat:online", (count) => setOnlineCount(count));
        socketInstance.on("chat:typing", onTyping);

        return () => {
            socketInstance.disconnect();
        };
    }, [token, user]);

    const sendMessage = useCallback(
        (type: ChatMessage["type"], content: string) => {
            if (!content.trim() || !user || !socket) return;

            const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const payload: ChatMessage = {
                id: optimisticId,
                senderId: user.id,
                senderName: user.name,
                senderImage: user.image || "",
                type,
                content: content.trim(),
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, payload]);

            socket.emit("chat:send", {
                senderId: payload.senderId,
                senderName: payload.senderName,
                senderImage: payload.senderImage,
                type: payload.type,
                content: payload.content,
            });
        },
        [user, socket]
    );

    const sendTyping = useCallback((isTyping: boolean) => {
        if (!user || !socket) return;
        socket.emit("chat:typing", {
            senderName: user.name,
            isTyping,
        });
    }, [user, socket]);

    const handleInputChange = useCallback(() => {
        sendTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => sendTyping(false), 1500);
    }, [sendTyping]);

    return {
        messages,
        onlineCount,
        typingUsers,
        connected,
        sendMessage,
        handleInputChange,
        senderId: user?.id || "",
        senderName: user?.name || "Anonymous",
        senderImage: user?.image || "",
    };
}
