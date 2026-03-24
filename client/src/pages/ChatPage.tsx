import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Send, Mic, ImagePlus, User, Wifi, WifiOff, ChevronDown, MessageCircle, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { ChatMessage } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ImageCropDialog from "@/components/ImageCropDialog";

function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <div className={cn("flex items-end gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center shadow-inner">
                {msg.senderImage ? (
                    <img src={msg.senderImage} alt={msg.senderName} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-4 h-4 text-white/40" />
                )}
            </div>

            <div className={cn("flex flex-col gap-1 max-w-[75%] sm:max-w-[60%]", isOwn ? "items-end" : "items-start")}>
                {/* Sender name (others only) */}
                {!isOwn && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400/80 px-1 truncate max-w-full">
                        {msg.senderName || "Anonymous"}
                    </span>
                )}

                {/* Bubble */}
                <div
                    className={cn(
                        "rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-md overflow-hidden",
                        msg.type !== "image" && "px-4 py-2.5",
                        isOwn
                            ? msg.type !== "image" && "bg-orange-500 text-black rounded-br-md font-medium"
                            : msg.type !== "image" && "bg-white/[0.07] text-white border border-white/[0.07] rounded-bl-md backdrop-blur-xl",
                        msg.type === "image" && "bg-transparent border-0 shadow-none"
                    )}
                >
                    {msg.type === "text" && <p className="break-words whitespace-pre-wrap">{msg.content}</p>}

                    {msg.type === "image" && (
                        <img
                            src={msg.content}
                            alt="shared"
                            className="rounded-2xl max-w-[240px] sm:max-w-[300px] max-h-[260px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(msg.content, "_blank")}
                        />
                    )}

                    {msg.type === "audio" && (
                        <div className="flex items-center gap-3 w-48 sm:w-56 py-1">
                            <audio 
                                ref={audioRef} 
                                src={msg.content} 
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={() => setIsPlaying(false)}
                                onLoadedMetadata={handleLoadedMetadata}
                                onTimeUpdate={handleTimeUpdate}
                                className="hidden" 
                            />
                            {/* Custom Play/Pause Button */}
                            <button
                                onClick={togglePlay}
                                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-all flex-shrink-0"
                            >
                                {isPlaying ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-current"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-current translate-x-0.5"><path d="M5 3l14 9-14 9z" /></svg>
                                )}
                            </button>

                            {/* Custom Waveform / Progress */}
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="h-1 bg-black/10 rounded-full w-full overflow-hidden relative">
                                    <div 
                                        className="absolute left-0 top-0 h-full bg-current rounded-full" 
                                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] opacity-60">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Time */}
                <span className="text-[9px] text-white/25 px-1">{timeStr}</span>
            </div>
        </div>
    );
}

// ─── Chat Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { messages, onlineCount, typingUsers, connected, sendMessage, handleInputChange, senderId } = useChat();
    const { recording, startRecording, stopRecording, stream } = useAudioRecorder(); // 🎙️ Attached stream

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 🔬 Audio Visualizer Effect Loop triggers Node flawlessly
    useEffect(() => {
        if (!stream || !canvasRef.current || !recording) return;

        const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextConstructor();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; 

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;

        const drawVisualizer = () => {
            animationId = requestAnimationFrame(drawVisualizer);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = 2.5; // 📐 Thicker bars
            const barGap = 1.5; // 📐 Tighter gap
            let x = 0;

            // 🔮 Gorgeous Gradient triggers Node flawlessly setup
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, "#f97316"); // 🟠 Orange
            gradient.addColorStop(1, "#ec4899"); // 🌸 Pink

            ctx.fillStyle = gradient;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height * 0.75;
                const height = Math.max(barHeight, 3); // Continuous baseline 

                const y = (canvas.height - height) / 2;
                
                // 💊 Draw smooth rounded pills if supported
                if ("roundRect" in ctx) {
                    ctx.beginPath();
                    (ctx as any).roundRect(x, y, barWidth, height, 1.5);
                    ctx.fill();
                } else {
                    (ctx as any).fillRect(x, y, barWidth, height); 
                }

                x += barWidth + barGap;
            }
        };

        drawVisualizer();

        return () => {
            cancelAnimationFrame(animationId);
            if(audioCtx.state !== 'closed') audioCtx.close();
        };
    }, [stream, recording]);

    // Image Crop States
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    // 🎙️ Voice Note Preview States
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [durationSec, setDurationSec] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const previewAudioRef = useRef<HTMLAudioElement>(null);
    const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
    const [previewCurrentTime, setPreviewCurrentTime] = useState(0);

    // Auto-scroll
    const isAtBottom = () => {
        const c = messagesContainerRef.current;
        if (!c) return true;
        return c.scrollHeight - c.scrollTop - c.clientHeight < 80;
    };

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
    };

    // Scroll to bottom on first load
    useEffect(() => {
        scrollToBottom(false);
    }, []);

    // Scroll as new messages arrive
    useEffect(() => {
        if (messages.length === 0) return;
        if (isAtBottom()) {
            scrollToBottom();
        } else {
            setShowScrollBtn(true);
        }
    }, [messages]);

    const handleScroll = () => {
        if (isAtBottom()) setShowScrollBtn(false);
    };

    // Send text
    const handleSendText = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        sendMessage("text", trimmed);
        setText("");
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    // Triggered when file input picks an item
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image too large (max 10MB)");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    // Triggered after hitting 'Crop' button inside Dialog
    const handleCropComplete = async (croppedBlob: Blob) => {
        const formData = new FormData();
        formData.append("image", croppedBlob, "chat-image.jpg");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/chat/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) sendMessage("image", data.url);
        } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Failed to upload image");
        } finally {
            setShowCropper(false);
            setTempImage(null);
        }
    };

    // 🎙️ Handle Voice Recording Controller states
    useEffect(() => {
        if (recording) {
            setDurationSec(0);
            timerRef.current = setInterval(() => {
                setDurationSec((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [recording]);

    const handleMicToggle = async () => {
        if (!recording) {
            setRecordedBlob(null);
            setPreviewUrl(null);
            await startRecording();
        } else {
            const blob = await stopRecording();
            if (!blob) return;
            setRecordedBlob(blob);
            setPreviewUrl(URL.createObjectURL(blob));
        }
    };

    const handleSendVoice = async () => {
        if (!recordedBlob) return;

        const formData = new FormData();
        formData.append("audio", recordedBlob, "voice-note.m4a");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/chat/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) sendMessage("audio", data.url);
        } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Failed to upload audio");
        } finally {
            // Reset
            setRecordedBlob(null);
            setPreviewUrl(null);
        }
    };

    const formatTimer = (sec: number) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <div className="flex flex-col h-svh bg-[#080808] text-white">
            {/* ── Top Header ─────────────────────────────────────────────────── */}
            <header className="flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-white/[0.06] bg-[#0d0d0d]/80 backdrop-blur-xl shrink-0 sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-white/60" />
                </button>

                <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white tracking-tight">Global Chat</h1>
                        <div className="flex items-center gap-1.5">
                            {connected ? (
                                <Wifi className="w-2.5 h-2.5 text-green-400" />
                            ) : (
                                <WifiOff className="w-2.5 h-2.5 text-red-400 animate-pulse" />
                            )}
                            <span className="text-[9px] text-white/30 font-semibold uppercase tracking-widest">
                                {connected ? `${onlineCount} online` : "Reconnecting..."}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Messages Area ───────────────────────────────────────────────── */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-5"
            >
                {/* Max-width container for large screens */}
                <div className="max-w-2xl mx-auto space-y-5">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-white/15">
                            <MessageCircle className="w-14 h-14" />
                            <div className="text-center">
                                <p className="font-bold text-sm">No messages yet</p>
                                <p className="text-xs mt-1">Be the first to say hi! 👋</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === senderId} />
                    ))}

                    {/* Typing dots */}
                    {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 pl-11">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:300ms]" />
                            </div>
                            <span className="text-[10px] text-white/30 italic">
                                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                            </span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Scroll-to-bottom FAB */}
            {showScrollBtn && (
                <button
                    onClick={() => { scrollToBottom(); setShowScrollBtn(false); }}
                    className="fixed bottom-24 right-4 sm:right-8 w-10 h-10 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-xl shadow-orange-500/30 animate-bounce z-10"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            )}

            {/* ── Input Bar ───────────────────────────────────────────────────── */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

            <div className="shrink-0 px-3 sm:px-6 py-3 pb-safe border-t border-white/[0.06] bg-[#0d0d0d]/80 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.07] rounded-2xl px-3 py-2 min-h-[52px]">
                        
                        {/* ─── STAGE 1 & 2: Recording Or Preview ───────────────────── */}
                        {recording || previewUrl ? (
                            <div className="flex items-center justify-between w-full gap-3">
                                {/* Trash / Stop Button */}
                                <button
                                    onClick={() => {
                                        if (recording) stopRecording(); // Stop first
                                        setRecordedBlob(null);
                                        setPreviewUrl(null);
                                    }}
                                    className="w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all"
                                    title="Delete Recording"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                </button>

                      
                                <div className="flex-1 flex items-center gap-3">
                                    {recording ? (
                                        <div className="flex-1 flex items-center gap-3 pr-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-md shadow-red-500/50" />
                                                <span className="text-sm font-mono tracking-wider text-pink-500">{formatTimer(durationSec)}</span>
                                            </div>
                                          
                                            <canvas 
                                                ref={canvasRef} 
                                                width={160} 
                                                height={24} 
                                                className="flex-1 h-6 bg-transparent" 
                                            />
                                        </div>
                                    ) : (
                                        // 🎧 WhatsApp Custom Preview Slider node flawless setup Node Node
                                        <div className="flex-1 flex items-center gap-2 group/player">
                                            {/* 🎙️ Hidden standard player Node setup layout Node Node flawlessly setup */}
                                            <audio 
                                                ref={previewAudioRef} 
                                                src={previewUrl || ""} 
                                                onTimeUpdate={() => setPreviewCurrentTime(previewAudioRef.current?.currentTime || 0)}
                                                onPlay={() => setPreviewIsPlaying(true)}
                                                onPause={() => setPreviewIsPlaying(false)}
                                                onEnded={() => setPreviewIsPlaying(false)}
                                                className="hidden" 
                                            />

                                            <button
                                                onClick={() => {
                                                    const aud = previewAudioRef.current;
                                                    if (!aud) return;
                                                    if (aud.paused) aud.play().catch(console.error);
                                                    else aud.pause();
                                                }}
                                                className="w-7 h-7 flex-shrink-0 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
                                            >
                                                {previewIsPlaying ? (
                                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                                ) : (
                                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                                )}
                                            </button>

                                            {/* 📊 Smooth Custom Linear Progress Bar node setup flawlessly Node layout */}
                                            <div className="flex-1 h-1 bg-white/10 rounded-full relative cursor-pointer group-hover/player:bg-white/20 overflow-hidden">
                                                <div 
                                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full transition-all"
                                                    style={{ width: `${(previewCurrentTime / Math.max(durationSec, 1)) * 100}%` }}
                                                />
                                            </div>

                                            <span className="text-[10px] font-mono tracking-tight text-white/40">
                                                {/* Node custom time Node flawlessly setup */}
                                                {durationSec > 0 ? durationSec - Math.floor(previewCurrentTime) : "0:00"}s
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Send / Stop Recording */}
                                {recording ? (
                                    <Button
                                        size="icon"
                                        onClick={handleMicToggle}
                                        className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/40"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                                    </Button>
                                ) : (
                                    <Button
                                        size="icon"
                                        onClick={handleSendVoice}
                                        className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/40 transition-transform active:scale-95"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            /* ─── STAGE 0: Standard Text Input ────────────────────────── */
                            <>
                                {/* Image */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-white/40 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                                    title="Send Image"
                                >
                                    <ImagePlus className="w-4 h-4" />
                                </button>

                                {/* Text */}
                                <textarea
                                    ref={textareaRef}
                                    value={text}
                                    rows={1}
                                    placeholder="Say something..."
                                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 resize-none outline-none leading-5 max-h-32 overflow-y-auto py-2"
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        handleInputChange();
                                        e.target.style.height = "auto";
                                        e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendText();
                                        }
                                    }}
                                />

                                {/* Mic */}
                                <button
                                    onClick={handleMicToggle}
                                    className={cn(
                                        "w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-all",
                                        "text-white/40 hover:text-orange-400 hover:bg-orange-500/10"
                                    )}
                                    title="Record Voice"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>

                                {/* Send Text */}
                                <Button
                                    size="icon"
                                    disabled={!text.trim()}
                                    onClick={handleSendText}
                                    className="w-9 h-9 flex-shrink-0 rounded-full bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-orange-500/30 transition-all active:scale-90"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Crop Dialog Overlay */}
            {tempImage && (
                <ImageCropDialog 
                    image={tempImage}
                    open={showCropper}
                    onClose={() => {
                        setShowCropper(false);
                        setTempImage(null);
                    }}
                    onCropComplete={handleCropComplete}
                    aspectRatio={4 / 3} // Wide crop for layout feed
                />
            )}
        </div>
    );
}
