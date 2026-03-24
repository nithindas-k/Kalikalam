import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Send, Mic, MicOff, ImagePlus, User, Wifi, WifiOff, ChevronDown, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { ChatMessage } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ImageCropDialog from "@/components/ImageCropDialog";

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

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
                        "rounded-2xl px-4 py-2.5 text-[13px] sm:text-sm leading-relaxed shadow-md",
                        isOwn
                            ? "bg-orange-500 text-black rounded-br-md font-medium"
                            : "bg-white/[0.07] text-white border border-white/[0.07] rounded-bl-md backdrop-blur-xl"
                    )}
                >
                    {msg.type === "text" && <p className="break-words whitespace-pre-wrap">{msg.content}</p>}

                    {msg.type === "image" && (
                        <img
                            src={msg.content}
                            alt="shared"
                            className="rounded-xl max-w-[240px] sm:max-w-[300px] max-h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.content, "_blank")}
                        />
                    )}

                    {msg.type === "audio" && (
                        <audio src={msg.content} controls className="h-9 w-52 sm:w-64" />
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
    const { recording, startRecording, stopRecording } = useAudioRecorder();

    // Image Crop States
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

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

    // Send voice note (HTTP Upload + Socket)
    const handleMicToggle = async () => {
        if (!recording) {
            await startRecording();
        } else {
            const blob = await stopRecording();
            if (!blob) return;

            const formData = new FormData();
            formData.append("audio", blob, "voice-note.m4a");

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
            }
        }
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
                    <div className="flex items-end gap-2 bg-white/[0.05] border border-white/[0.07] rounded-2xl px-3 py-2">
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
                                recording
                                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40"
                                    : "text-white/40 hover:text-orange-400 hover:bg-orange-500/10"
                            )}
                            title={recording ? "Stop Recording" : "Record Voice"}
                        >
                            {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>

                        {/* Send */}
                        <Button
                            size="icon"
                            disabled={!text.trim() && !recording}
                            onClick={handleSendText}
                            className="w-9 h-9 flex-shrink-0 rounded-full bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-orange-500/30 transition-all active:scale-90"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    <p className="text-[9px] text-white/15 text-center mt-1.5">
                        Enter to send · Shift+Enter for new line
                    </p>
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
