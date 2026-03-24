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
        { urls: "stun:stun.l.google.com:19302" }
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

    useEffect(() => {
       
        const socket = io(SOCKET_URL, {
            query: { userName: "User_" + Math.random().toString(36).slice(2, 6) },
            transports: ["websocket"]
        });
        socketRef.current = socket;

        socket.on("voice:participants", (list: any[]) => {
            console.log("🎙️ Received voice:participants from server:", list);
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

        socket.on("voice:signal", async (data: { from: string; signal: any }) => {
            const pc = peerConnections.current.get(data.from) || await createPeerConnection(data.from, false);
            
            if (data.signal.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
                if (data.signal.sdp.type === "offer") {
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socketRef.current?.emit("voice:signal", { to: data.from, signal: { sdp: pc.localDescription } });
                }
            } else if (data.signal.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
            }
        });

        socket.on("voice:user-left", ({ socketId }: { socketId: string }) => {
            closePeerConnection(socketId);
        });

        return () => {
            leaveVoice();
            socket.disconnect();
        };
    }, []);

    const createPeerConnection = async (targetSocketId: string, isOfferor: boolean) => {
        if (peerConnections.current.has(targetSocketId)) return peerConnections.current.get(targetSocketId)!;

        console.log(`Creating RTCPeerConnection for ${targetSocketId} (Offeror: ${isOfferor})`);
        const pc = new RTCPeerConnection(configuration);
        peerConnections.current.set(targetSocketId, pc);

        // Add Local Tracks to PC
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // On Ice Candidate Node flawlessly layout setup
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit("voice:signal", { to: targetSocketId, signal: { candidate: event.candidate } });
            }
        };

        // On Remote Track flawlessly layout
        pc.ontrack = (event) => {
            console.log(`Received remote track for ${targetSocketId}`);
            if (event.streams && event.streams[0]) {
                let audio = remoteAudiosRef.current.get(targetSocketId);
                if (!audio) {
                    audio = document.createElement("audio");
                    audio.autoplay = true;
                    document.body.appendChild(audio);
                    remoteAudiosRef.current.set(targetSocketId, audio);
                }
                audio.srcObject = event.streams[0];
                audio.play().catch(e => console.log("Audio auto-play prevented:", e));
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
    };

    const joinVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            setIsConnected(true);

            const userProfile = { 
                id: (user as any)?._id || (user as any)?.id || `${Date.now()}`, 
                name: user?.name || "Anonymous", 
                avatar: user?.image || "" 
            };
            
            socketRef.current?.emit("voice:join", userProfile);
        } catch (err) {
            console.error("Failed to get mic stream:", err);
            alert("Mic permission denied!");
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
