import { useRef, useState, useEffect } from "react";
import { MessageCircle, X, Send, Mic, MicOff, ImagePlus, User, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { ChatMessage } from "@/types/chat.types";
import { cn } from "@/lib/utils";

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <div className={cn("flex items-end gap-2 group", isOwn ? "flex-row-reverse" : "flex-row")}>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                {msg.senderImage ? (
                    <img src={msg.senderImage} alt={msg.senderName} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-3.5 h-3.5 text-white/40" />
                )}
            </div>

            <div className={cn("flex flex-col gap-0.5 max-w-[72%]", isOwn ? "items-end" : "items-start")}>
                {/* Sender name */}
                {!isOwn && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400/70 px-1 truncate max-w-full">
                        {msg.senderName}
                    </span>
                )}

                {/* Bubble content */}
                <div
                    className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-md transition-all",
                        isOwn
                            ? "bg-orange-500 text-black rounded-br-sm"
                            : "bg-white/8 text-white border border-white/8 rounded-bl-sm backdrop-blur-xl"
                    )}
                >
                    {msg.type === "text" && <p className="break-words">{msg.content}</p>}

                    {msg.type === "image" && (
                        <img
                            src={msg.content}
                            alt="shared"
                            className="rounded-xl max-w-[220px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.content, "_blank")}
                        />
                    )}

                    {msg.type === "audio" && (
                        <audio
                            src={msg.content}
                            controls
                            className="h-8 w-48 sm:w-56 [&::-webkit-media-controls-panel]:bg-transparent"
                        />
                    )}
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-white/20 px-1">{timeStr}</span>
            </div>
        </div>
    );
}

// ─── Global Chat Panel ────────────────────────────────────────────────────────
export default function GlobalChat() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [unread, setUnread] = useState(0);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { messages, onlineCount, typingUsers, connected, sendMessage, handleInputChange, senderId } = useChat();
    const { recording, startRecording, stopRecording } = useAudioRecorder();

    // Auto-scroll logic
    const isAtBottom = () => {
        const c = messagesContainerRef.current;
        if (!c) return true;
        return c.scrollHeight - c.scrollTop - c.clientHeight < 60;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (open) {
            scrollToBottom();
            setUnread(0);
        }
    }, [open]);

    useEffect(() => {
        if (messages.length === 0) return;
        if (!open) {
            setUnread((u) => u + 1);
        } else if (isAtBottom()) {
            scrollToBottom();
        } else {
            setShowScrollBtn(true);
        }
    }, [messages]);

    const handleScroll = () => {
        if (isAtBottom()) {
            setShowScrollBtn(false);
        }
    };

    // Send text message
    const handleSendText = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        sendMessage("text", trimmed);
        setText("");
    };

    // Send image message (base64)
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("Image too large (max 2MB)");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            sendMessage("image", reader.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    // Send audio message (base64)
    const handleMicToggle = async () => {
        if (!recording) {
            await startRecording();
        } else {
            const blob = await stopRecording();
            if (!blob) return;
            const reader = new FileReader();
            reader.onloadend = () => {
                sendMessage("audio", reader.result as string);
            };
            reader.readAsDataURL(blob);
        }
    };

    return (
        <>
            {/* ── Floating Trigger Button ── */}
            <button
                onClick={() => {
                    setOpen(true);
                    setUnread(0);
                }}
                className={cn(
                    "fixed bottom-6 right-4 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full",
                    "bg-orange-500 hover:bg-orange-400 text-black shadow-2xl shadow-orange-500/40",
                    "flex items-center justify-center transition-all duration-300 active:scale-90",
                    open && "opacity-0 pointer-events-none"
                )}
                title="Global Chat"
            >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {/* ── Chat Panel ── */}
            <div
                className={cn(
                    "fixed inset-0 z-50 flex items-end sm:items-center justify-end transition-all duration-300",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            >
                {/* Backdrop (mobile only) */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm sm:hidden"
                    onClick={() => setOpen(false)}
                />

                {/* Panel */}
                <div
                    className={cn(
                        "relative flex flex-col",
                        // Mobile: full-width bottom sheet
                        "w-full h-[88svh] rounded-t-3xl",
                        // Desktop: fixed-size side panel
                        "sm:w-[380px] sm:h-[600px] sm:rounded-2xl sm:mr-6 sm:mb-6",
                        "bg-[#0d0d0d] border border-white/8 shadow-2xl shadow-black/60",
                        "transition-transform duration-300",
                        open ? "translate-y-0" : "translate-y-full sm:translate-y-10"
                    )}
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <MessageCircle className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white">Global Chat</h2>
                                <div className="flex items-center gap-1.5">
                                    {connected ? (
                                        <Wifi className="w-2.5 h-2.5 text-green-400" />
                                    ) : (
                                        <WifiOff className="w-2.5 h-2.5 text-red-400" />
                                    )}
                                    <span className="text-[9px] text-white/30 font-medium uppercase tracking-wider">
                                        {connected
                                            ? `${onlineCount} online`
                                            : "Reconnecting..."}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-white/50" />
                        </button>
                    </div>

                    {/* ── Messages ── */}
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    >
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
                                <MessageCircle className="w-10 h-10" />
                                <p className="text-xs text-center">No messages yet.<br />Be the first to say hi! 👋</p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === senderId} />
                        ))}

                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex items-center gap-2 pl-9">
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

                    {/* Scroll to bottom btn */}
                    {showScrollBtn && (
                        <button
                            onClick={() => {
                                scrollToBottom();
                                setShowScrollBtn(false);
                            }}
                            className="absolute bottom-20 right-4 w-8 h-8 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-lg animate-bounce"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    )}

                    {/* ── Input Bar ── */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                    />

                    <div className="px-3 pb-4 pt-2 border-t border-white/6 shrink-0">
                        <div className="flex items-end gap-2 bg-white/5 border border-white/8 rounded-2xl px-3 py-2">
                            {/* Image button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-white/40 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                                title="Send Image"
                            >
                                <ImagePlus className="w-4 h-4" />
                            </button>

                            {/* Text input */}
                            <textarea
                                value={text}
                                rows={1}
                                placeholder="Say something..."
                                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 resize-none outline-none leading-5 max-h-28 overflow-y-auto py-1"
                                onChange={(e) => {
                                    setText(e.target.value);
                                    handleInputChange();
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendText();
                                    }
                                }}
                            />

                            {/* Mic button */}
                            <button
                                onMouseDown={handleMicToggle}
                                className={cn(
                                    "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all",
                                    recording
                                        ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40"
                                        : "text-white/40 hover:text-orange-400 hover:bg-orange-500/10"
                                )}
                                title={recording ? "Stop Recording" : "Record Voice"}
                            >
                                {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>

                            {/* Send button */}
                            <Button
                                size="icon"
                                disabled={!text.trim() && !recording}
                                onClick={handleSendText}
                                className="w-8 h-8 flex-shrink-0 rounded-full bg-orange-500 hover:bg-orange-400 text-black disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-orange-500/30 transition-all active:scale-90"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <p className="text-[9px] text-white/15 text-center mt-1.5">
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
