import { useState } from "react";
import { Play, Pencil, Trash2, Clock, Pause, Lock, Unlock, Key, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { VideoItem } from "@/types/video.types";
import { cn } from "@/lib/utils";
import { getDeviceId, getUnlockedIds, markAsUnlocked } from "@/utils/device";
import { videoService } from "@/services/videoService";
import { toast } from "sonner";

interface VideoCardProps {
    video: VideoItem;
    isActive: boolean;
    isPlaying: boolean;
    onPlay: (video: VideoItem) => void;
    onEdit: (video: VideoItem) => void;
    onDelete: (video: VideoItem) => void;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
}

export default function VideoCard({ video, isActive, isPlaying, onPlay, onEdit, onDelete }: VideoCardProps) {
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [accessKeyInput, setAccessKeyInput] = useState("");
    const [isLocalUnlocked, setIsLocalUnlocked] = useState(getUnlockedIds().includes(video.id));
    const [shake, setShake] = useState(false);

    const [isHovering, setIsHovering] = useState(false);

    const isOwner = video.creatorId === getDeviceId();
    const isLocked = video.isPrivate && !isOwner && !isLocalUnlocked;

    const handleUnlock = async () => {
        if (!accessKeyInput.trim()) return;
        setIsUnlocking(true);
        const success = await videoService.verifyKey(video.id, accessKeyInput);
        if (success) {
            markAsUnlocked(video.id);
            setIsLocalUnlocked(true);
            toast.success("Content unlocked!");
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            toast.error("Invalid access key");
        }
        setIsUnlocking(false);
    };

    return (
        <Card
            className={cn(
                "group relative overflow-hidden border-border bg-card transition-all duration-500 shadow-xl w-full",
                isActive ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50",
                isLocked && "hover:shadow-primary/5 shadow-2xl"
            )}
            onMouseEnter={() => !isLocked && setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Thumbnail Area */}
            <div
                className="relative w-full cursor-pointer overflow-hidden bg-black/40"
                onClick={() => !isLocked && onPlay(video)}
            >
                {/* Regular Thumbnail */}
                <img
                    src={video.thumbnailUrl || video.videoUrl}
                    alt={video.name}
                    className={cn(
                        "w-full h-auto transition-all duration-700 ease-in-out",
                        !isLocked && "group-hover:scale-105",
                        isLocked && "blur-xl scale-110 opacity-70"
                    )}
                    loading="lazy"
                />

                {/* Hover Video Preview */}
                {!isLocked && (
                    <video
                        src={video.videoUrl}
                        muted
                        loop
                        playsInline
                        className={cn(
                            "absolute inset-0 h-full w-full object-contain transition-opacity duration-500 bg-black/60",
                            isHovering ? "opacity-100" : "opacity-0"
                        )}
                        ref={(el) => {
                            if (el) {
                                if (isHovering) el.play().catch(() => { });
                                else {
                                    el.pause();
                                    el.currentTime = 0;
                                }
                            }
                        }}
                    />
                )}

                {/* Status Badge */}
                {!isLocked && (
                    <div className="absolute left-2 top-2 flex flex-col gap-1.5 z-10">
                        {isPlaying && (
                            <Badge variant="default" className="bg-primary text-black font-extrabold animate-pulse px-2 py-0.5 shadow-lg shadow-primary/20">
                                Playing
                            </Badge>
                        )}
                        {video.isPrivate && (
                            <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-white/20 gap-1 px-2 py-0.5 capitalize shadow-lg">
                                <Unlock className="h-3 w-3" />
                                Private
                            </Badge>
                        )}
                    </div>
                )}

                {/* Play Overlay (Only if not locked) */}
                {!isLocked ? (
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300",
                        isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/30 transition-transform active:scale-90">
                            {isPlaying ? (
                                <Pause className="h-6 w-6 fill-black" />
                            ) : (
                                <Play className="ml-1 h-6 w-6 fill-black" />
                            )}
                        </div>
                    </div>
                ) : (
                    /* Locked UI - Premium Redesign */
                    <div className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-5 text-center transition-all duration-500",
                        shake && "shake-anim bg-destructive/10 backdrop-blur-3xl",
                        !shake && "bg-black/80 backdrop-blur-[2px]"
                    )}>
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <Lock className="h-24 w-24 text-white -mr-8 -mt-8" />
                        </div>

                        <div className="mb-2 rounded-full bg-white/5 p-2 backdrop-blur-xl border border-white/10 shadow-2xl transition-transform hover:scale-110 duration-500">
                            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-in zoom-in duration-700" />
                        </div>

                        <h4 className="mb-1 text-[10px] sm:text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-80">Private Vault</h4>
                        <p className="mb-3 text-[8px] sm:text-[9px] text-white/40 italic px-2 leading-tight font-medium">Enter secret key to unlock</p>

                        <div className="flex w-full flex-col gap-2 max-w-[130px] sm:max-w-[150px]">
                            <div className="relative group/input">
                                <Key className="absolute left-2.5 top-2 h-3 w-3 text-primary/40 group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="Enter Key"
                                    className="h-7 sm:h-8 border-white/10 bg-black/60 pl-7 sm:pl-8 text-[10px] sm:text-xs text-white placeholder:text-white/20 backdrop-blur-xl focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all rounded-xl"
                                    value={accessKeyInput}
                                    onChange={(e) => setAccessKeyInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <Button
                                size="sm"
                                className="h-7 sm:h-8 w-full text-[9px] sm:text-[10px] font-black shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest bg-primary text-black hover:bg-primary/90 rounded-xl"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlock();
                                }}
                                disabled={isUnlocking}
                            >
                                {isUnlocking ? "..." : "Unlock"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <CardContent className="p-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="line-clamp-1 text-sm font-black text-foreground tracking-tight">
                            {video.name}
                        </h3>
                        {isOwner && video.isPrivate && video.accessKey && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(video.accessKey!);
                                    toast.success("Key copied!");
                                }}
                                className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[8px] sm:text-[9px] font-black text-primary border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 shadow-sm group/key"
                            >
                                <Key className="h-2 w-2 opacity-70 group-hover:opacity-100" />
                                <span className="tracking-widest">{video.accessKey}</span>
                                <Copy className="h-2 w-2 opacity-50 group-hover:opacity-100" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-tighter">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(video.createdAt)}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2 p-3 pt-0">
                <Button
                    variant={isPlaying ? "default" : "secondary"}
                    size="sm"
                    className={cn(
                        "h-8 flex-1 gap-2 text-[9px] sm:text-[10px] font-black transition-all uppercase tracking-widest shadow-sm rounded-xl",
                        isPlaying ? "bg-primary text-black hover:bg-primary/90 shadow-primary/20 shadow-md scale-[1.02]" : "hover:bg-accent hover:text-accent-foreground",
                        isLocked && "opacity-40 cursor-not-allowed bg-muted/10 grayscale-[0.5]"
                    )}
                    onClick={() => !isLocked && onPlay(video)}
                    disabled={isLocked}
                >
                    {isLocked ? (
                        <>
                            <Lock className="h-3 w-3" />
                            <span>Locked</span>
                        </>
                    ) : (
                        <>
                            {isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                            <span>{isPlaying ? "Pause" : "Watch"}</span>
                        </>
                    )}
                </Button>
                {isOwner && (
                    <div className="flex gap-1 text-muted-foreground">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border hover:border-primary hover:bg-primary/10 hover:text-primary transition-all active:scale-90 rounded-xl"
                            onClick={() => onEdit(video)}
                        >
                            <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all active:scale-90 rounded-xl"
                            onClick={() => onDelete(video)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
