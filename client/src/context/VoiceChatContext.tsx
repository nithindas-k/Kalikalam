import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Participant } from "@/components/ui/audio-chat";

import { useAuth } from "@/context/AuthContext";

interface VoiceChatContextType {
    participants: Participant[];
    isConnected: boolean;
    isMuted: boolean;
    joinVoice: () => Promise<void>;
    leaveVoice: () => void;
    toggleMute: () => void;
}

export const VoiceChatContext = createContext<VoiceChatContextType | undefined>(undefined);

const rawApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_URL = rawApiUrl.replace(/\/api$/, "");

const configuration: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
    ]
};

export function VoiceChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    const socketRef = useRef<Socket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const iceCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const userRef = useRef(user);
    const pendingConnections = useRef<Set<string>>(new Set());

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const emitJoin = () => {
        const currentUser = userRef.current;
        const userProfile = { 
            id: (currentUser as any)?._id || (currentUser as any)?.id || `${Date.now()}`, 
            name: currentUser?.name || "Anonymous", 
            avatar: currentUser?.image || "" 
        };
        console.log("📤 Emitting voice:join", userProfile);
        socketRef.current?.emit("voice:join", userProfile);
        sessionStorage.setItem("voice_active", "true");
    };

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            query: { userName: "User_" + Math.random().toString(36).slice(2, 6) },
            transports: ["websocket"]
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("🎙️ Socket connected to voice server");
            if (sessionStorage.getItem("voice_active") === "true") {
                console.log("🔄 Re-syncing voice join after reconnect/reload");
                // We don't call joinVoice directly here to avoid permission loops, 
                // but if isConnected is already true (reconnect), we emitJoin.
            }
        });

        socket.on("voice:participants", (list: any[]) => {
            setParticipants(list.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                isSpeaking: p.isSpeaking
            })));
        });

        socket.on("voice:user-joined", async (data: { socketId: string; name: string }) => {
            console.log(`🎙️ New peer joined: ${data.name}`);
            await createPeerConnection(data.socketId, true);
        });

        const handleSignal = async (data: { from: string; signal: any }) => {
            let pc = peerConnections.current.get(data.from);
            
            if (data.signal.sdp) {
                if (!pc) {
                    if (pendingConnections.current.has(data.from)) {
                        setTimeout(() => handleSignal(data), 100);
                        return;
                    }
                    pc = await createPeerConnection(data.from, false);
                }
                
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
                    if (data.signal.sdp.type === "offer") {
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socketRef.current?.emit("voice:signal", { to: data.from, signal: { sdp: pc.localDescription } });
                    }
                    const queued = iceCandidatesQueue.current.get(data.from) || [];
                    while (queued.length > 0) {
                        const candidate = queued.shift();
                        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    iceCandidatesQueue.current.delete(data.from);
                } catch (e) { 
                    console.error("SDP error:", e);
                }
            } else if (data.signal.candidate) {
                if (pc && pc.remoteDescription && pc.signalingState !== "closed") {
                    try { await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate)); } catch (e) { }
                } else {
                    const queue = iceCandidatesQueue.current.get(data.from) || [];
                    queue.push(data.signal.candidate);
                    iceCandidatesQueue.current.set(data.from, queue);
                }
            }
        };

        socket.on("voice:signal", handleSignal);

        socket.on("voice:user-left", ({ socketId }: { socketId: string }) => {
            closePeerConnection(socketId);
        });

        // Auto-rejoin logic for reload
        if (sessionStorage.getItem("voice_active") === "true") {
            setTimeout(() => {
                joinVoice().catch(console.error);
            }, 1000);
        }

        return () => {
            socket.disconnect();
        };
    }, []);

    const createPeerConnection = async (targetSocketId: string, isOfferor: boolean) => {
        if (peerConnections.current.has(targetSocketId)) return peerConnections.current.get(targetSocketId)!;
        pendingConnections.current.add(targetSocketId);

        console.log(`🏗️ Creating RTC for ${targetSocketId} | Offeror: ${isOfferor}`);
        const pc = new RTCPeerConnection(configuration);
        peerConnections.current.set(targetSocketId, pc);
        pendingConnections.current.delete(targetSocketId);

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit("voice:signal", { to: targetSocketId, signal: { candidate: event.candidate } });
            }
        };

        pc.ontrack = (event) => {
            console.log(`🔊 Audio stream arrived from ${targetSocketId}`);
            if (event.streams && event.streams[0]) {
                let audio = remoteAudiosRef.current.get(targetSocketId);
                if (!audio) {
                    audio = document.createElement("audio");
                    audio.autoplay = true;
                    audio.style.display = "none";
                    document.body.appendChild(audio);
                    remoteAudiosRef.current.set(targetSocketId, audio);
                }
                audio.srcObject = event.streams[0];
                audio.volume = 1;
                audio.play().catch(e => console.warn("Autoplay block:", e));
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                closePeerConnection(targetSocketId);
            }
        };

        if (isOfferor) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit("voice:signal", { to: targetSocketId, signal: { sdp: pc.localDescription } });
        }

        return pc;
    };

    const closePeerConnection = (socketId: string) => {
        const pc = peerConnections.current.get(socketId);
        if (pc) {
            pc.close();
            peerConnections.current.delete(socketId);
        }
        const audio = remoteAudiosRef.current.get(socketId);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
            remoteAudiosRef.current.delete(socketId);
        }
        iceCandidatesQueue.current.delete(socketId);
    };

    const joinVoice = async () => {
        if (isConnected) {
            emitJoin();
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            setIsConnected(true);
            emitJoin();
        } catch (err) {
            console.error("Failed to get mic stream:", err);
            sessionStorage.removeItem("voice_active");
        }
    };

    const leaveVoice = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        peerConnections.current.forEach((_, key) => closePeerConnection(key));
        peerConnections.current.clear();
        socketRef.current?.emit("voice:leave");
        setIsConnected(false);
        sessionStorage.removeItem("voice_active");
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
                socketRef.current?.emit("voice:speaking", { isSpeaking: track.enabled });
            }
        }
    };

    return (
        <VoiceChatContext.Provider value={{ participants, isConnected, isMuted, joinVoice, leaveVoice, toggleMute }}>
            {children}
        </VoiceChatContext.Provider>
    );
}

export function useVoiceChat() {
    const context = useContext(VoiceChatContext);
    if (!context) throw new Error("useVoiceChat must be used within VoiceChatProvider");
    return context;
}
