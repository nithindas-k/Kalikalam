import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage, TypingIndicator } from "@/types/chat.types";
import { getDeviceId } from "@/utils/device";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace("/api", "")
    : "http://localhost:5000";


let _socket: Socket | null = null;

function getOrCreateSocket(): Socket {
    if (_socket) return _socket;
    _socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
    });
    return _socket;
}

// ─────────────────────────────────────────────────────────────────────────────
export function useChat() {
    const socketRef = useRef<Socket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const socket = getOrCreateSocket();
        socketRef.current = socket;

        const onConnect = () => {
            console.log("✅ Socket connected:", socket.id);
            setConnected(true);
        };
        const onDisconnect = (reason: string) => {
            console.log("❌ Socket disconnected:", reason);
            setConnected(false);
        };
        const onHistory = (history: ChatMessage[]) => setMessages(history);
        const onMessage = (msg: ChatMessage) => {
            console.log("Receive Broadcast 📨:", msg);
            setMessages((prev) => {
                // If this is OUR own message returning from the server, 
                // replace the optimistic one with the real one.
                const isOwn = msg.senderId === getDeviceId();
                if (isOwn) {
                    const optimisticIndex = prev.findIndex(m => m.id.startsWith("optimistic-") && m.content === msg.content);
                    if (optimisticIndex !== -1) {
                        const next = [...prev];
                        next[optimisticIndex] = msg; // Update with real DB ID
                        return next;
                    }
                }

                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };
        const onOnline = (count: number) => setOnlineCount(count);
        const onTyping = ({ senderName: name, isTyping }: TypingIndicator) => {
            setTypingUsers((prev) => {
                if (isTyping && !prev.includes(name)) return [...prev, name];
                if (!isTyping) return prev.filter((n) => n !== name);
                return prev;
            });
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("chat:history", onHistory);
        socket.on("chat:message", onMessage);
        socket.on("chat:online", onOnline);
        socket.on("chat:typing", onTyping);

        // Sync state if already connected
        if (socket.connected) {
            setConnected(true);
        } else {
            socket.connect();
        }

        // Cleanup: only remove listeners — DO NOT disconnect the singleton socket
        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("chat:history", onHistory);
            socket.off("chat:message", onMessage);
            socket.off("chat:online", onOnline);
            socket.off("chat:typing", onTyping);
        };
    }, []);

    const sendMessage = useCallback(
        (type: ChatMessage["type"], content: string) => {
            if (!content.trim()) return;

            // 1. Create Optimistic Message Payload immediately
            const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const payload: ChatMessage = {
                id: optimisticId,
                senderId: getDeviceId(),
                senderName: localStorage.getItem("visitor_name") || "Anonymous",
                senderImage: localStorage.getItem("visitor_image") || "",
                type,
                content: content.trim(),
                timestamp: new Date().toISOString(),
            };

            // 2. Append directly to local UI state for absolute zero-delay
            setMessages((prev) => [...prev, payload]);

            console.log("📤 Emitting chat:send", payload);

            // 3. Emit Omit IDs and match server signature
            socketRef.current?.emit("chat:send", {
                senderId: payload.senderId,
                senderName: payload.senderName,
                senderImage: payload.senderImage,
                type: payload.type,
                content: payload.content,
            });
        },
        []
    );

    const sendTyping = useCallback((isTyping: boolean) => {
        socketRef.current?.emit("chat:typing", {
            senderName: localStorage.getItem("visitor_name") || "Anonymous",
            isTyping,
        });
    }, []);

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
        senderId: getDeviceId(),
        senderName: localStorage.getItem("visitor_name") || "Anonymous",
        senderImage: localStorage.getItem("visitor_image") || "",
    };
}
