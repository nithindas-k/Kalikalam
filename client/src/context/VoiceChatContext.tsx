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
const SOCKET_URL = rawApiUrl.replace(/\/api\/?$/, "");

const configuration: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
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
    const isConnectedRef = useRef(isConnected);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        isConnectedRef.current = isConnected;
    }, [isConnected]);

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
            console.log("🎙️ Socket connected to voice server", socket.id);
            if (sessionStorage.getItem("voice_active") === "true") {
                joinVoice().catch(console.error);
            }
        });

        socket.on("voice:participants", async (list: any[]) => {
            const currentSocketId = socketRef.current?.id;
           
            setParticipants(list.map(p => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                isSpeaking: p.isSpeaking
            })));

            // 2. 🔌 AUTO-CONNECT: If I am connected, check if I need to connect to anyone new
            if (isConnectedRef.current) {
                for (const p of list) {
                    if (p.socketId !== currentSocketId && !peerConnections.current.has(p.socketId)) {
                        console.log(`🔌 Joining existing participant: ${p.name} (${p.socketId})`);
                        await createPeerConnection(p.socketId, true);
                    }
                }
            }
        });

        socket.on("voice:user-joined", async (data: { id: string; socketId: string; name: string }) => {
            const currentUserId = (userRef.current as any)?._id || (userRef.current as any)?.id;
            if (data.id === currentUserId) return; 
            
            console.log(`🎙️ New peer joined: ${data.name} (${data.socketId})`);
        });

        socket.on("voice:force-leave", () => {
             console.warn("⚠️ Forcefully disconnected by server due to duplicate session.");
             leaveVoice();
        });

        const handleSignal = async (data: { from: string; signal: any }) => {
            let pc = peerConnections.current.get(data.from);

            if (data.signal.sdp) {
                if (!pc) {
                    if (pendingConnections.current.has(data.from)) {
                        setTimeout(() => handleSignal(data), 100);
                        return;
                    }
                    console.log(`🤝 Received signal from ${data.from}, creating PeerConnection`);
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
                    try { await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate)); } catch { }
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

        return () => {
            socket.disconnect();
            peerConnections.current.forEach((_, id) => closePeerConnection(id));
        };
    }, []);

    const createPeerConnection = async (targetSocketId: string, isOfferor: boolean) => {
        if (peerConnections.current.has(targetSocketId)) return peerConnections.current.get(targetSocketId)!;
        pendingConnections.current.add(targetSocketId);

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
            const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);

            let audio = remoteAudiosRef.current.get(targetSocketId);
            if (!audio) {
                audio = document.createElement("audio");
                audio.autoplay = true;
                (audio as any).playsInline = true;
                audio.style.display = "none";
                document.body.appendChild(audio);
                remoteAudiosRef.current.set(targetSocketId, audio);
            }
            audio.srcObject = stream;
            audio.volume = 1;

            const playAudio = () => {
                audio!.play().catch(() => {
                    console.warn("🔊 Autoplay blocked, waiting for interaction");
                    document.addEventListener('click', playAudio, { once: true });
                });
            };
            playAudio();
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`🧊 ICE State for ${targetSocketId}: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
                setTimeout(() => {
                    if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
                        closePeerConnection(targetSocketId);
                    }
                }, 3000);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                closePeerConnection(targetSocketId);
            }
        };

        if (isOfferor) {
            try {
                const offer = await pc.createOffer({ offerToReceiveAudio: true });
                await pc.setLocalDescription(offer);
                socketRef.current?.emit("voice:signal", { to: targetSocketId, signal: { sdp: pc.localDescription } });
            } catch (err) {
                console.error("Failed to create offer:", err);
            }
        }

        return pc;
    };

    const closePeerConnection = (socketId: string) => {
        const pc = peerConnections.current.get(socketId);
        if (pc) {
            console.log(`🔌 Closing connection for ${socketId}`);
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
        pendingConnections.current.delete(socketId);
    };

    const joinVoice = async () => {
        if (isConnectedRef.current && localStreamRef.current) {
            emitJoin();
            return;
        }
        try {
            console.log("🎤 Getting local media stream...");
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            localStreamRef.current = stream;
            setIsConnected(true);
            emitJoin();
        } catch (err) {
            console.error("Failed to get mic stream:", err);
            sessionStorage.removeItem("voice_active");
            setIsConnected(false);
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
