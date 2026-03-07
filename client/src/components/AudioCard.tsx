import { useState } from "react";
import { Play, Pencil, Trash2, Clock, Pause, Lock, Unlock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AudioItem } from "@/types/audio.types";
import { cn } from "@/lib/utils";
import { getDeviceId, getUnlockedIds, markAsUnlocked } from "@/utils/device";
import { audioService } from "@/services/audioService";
import { toast } from "sonner";

interface AudioCardProps {
    audio: AudioItem;
    isActive: boolean;
    isPlaying: boolean;
    onPlay: (audio: AudioItem) => void;
    onEdit: (audio: AudioItem) => void;
    onDelete: (audio: AudioItem) => void;
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

export default function AudioCard({ audio, isActive, isPlaying, onPlay, onEdit, onDelete }: AudioCardProps) {
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [accessKeyInput, setAccessKeyInput] = useState("");
    const [isLocalUnlocked, setIsLocalUnlocked] = useState(getUnlockedIds().includes(audio.id));

    const isOwner = audio.creatorId === getDeviceId();
    const isLocked = audio.isPrivate && !isOwner && !isLocalUnlocked;

    const handleUnlock = async () => {
        if (!accessKeyInput.trim()) return;
        setIsUnlocking(true);
        const success = await audioService.unlock(audio.id, accessKeyInput);
        if (success) {
            markAsUnlocked(audio.id);
            setIsLocalUnlocked(true);
            toast.success("Content unlocked!");
        } else {
            toast.error("Invalid access key");
        }
        setIsUnlocking(false);
    };

    return (
        <Card className={cn(
            "group relative overflow-hidden border-border bg-card transition-all duration-300 shadow-lg",
            isActive ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"
        )}>
            {/* Thumbnail Area */}
            <div
                className="relative aspect-square w-full cursor-pointer overflow-hidden"
                onClick={() => !isLocked && onPlay(audio)}
            >
                <img
                    src={audio.imageUrl}
                    alt={audio.name}
                    className={cn(
                        "h-full w-full object-cover transition-transform duration-500",
                        !isLocked && "group-hover:scale-110",
                        isLocked && "blur-md scale-105"
                    )}
                    loading="lazy"
                />

                {/* Status Badge */}
                <div className="absolute left-2 top-2 flex flex-col gap-1.5 z-10">
                    {isPlaying && (
                        <Badge variant="default" className="bg-primary text-black font-bold animate-pulse">
                            Playing
                        </Badge>
                    )}
                    {audio.isPrivate && (
                        <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white border-white/20 gap-1 capitalize">
                            {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            Private
                        </Badge>
                    )}
                </div>

                {/* Play Overlay (Only if not locked) */}
                {!isLocked ? (
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300",
                        isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg transition-transform active:scale-90">
                            {isPlaying ? (
                                <Pause className="h-6 w-6 fill-black" />
                            ) : (
                                <Play className="ml-1 h-6 w-6 fill-black" />
                            )}
                        </div>
                    </div>
                ) : (
                    /* Locked UI */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
                        <div className="mb-4 rounded-full bg-white/10 p-3 backdrop-blur-xl border border-white/20">
                            <Lock className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="mb-4 text-sm font-bold text-white">Private Clip</h4>
                        <div className="flex w-full flex-col gap-2">
                            <div className="relative">
                                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="Enter Key"
                                    className="h-9 border-white/20 bg-black/40 pl-9 text-xs text-white placeholder:text-white/40 backdrop-blur-xl focus:ring-primary"
                                    value={accessKeyInput}
                                    onChange={(e) => setAccessKeyInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <Button
                                size="sm"
                                className="h-9 w-full font-bold shadow-lg shadow-primary/20 backdrop-blur-xl transition-all active:scale-95"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlock();
                                }}
                                disabled={isUnlocking}
                            >
                                {isUnlocking ? "Verifying..." : "Unlock Content"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <CardContent className="p-2.5 sm:p-3">
                <div className="flex flex-col gap-0.5">
                    <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                        {audio.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo(audio.createdAt)}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex gap-1.5 p-2.5 pt-0 sm:p-3 sm:pt-0">
                <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                        "h-8 flex-1 gap-1.5 text-[10px] font-bold sm:h-9 sm:text-xs transition-colors",
                        isPlaying ? "bg-primary text-black hover:bg-primary/90" : "",
                        isLocked && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isLocked && onPlay(audio)}
                    disabled={isLocked}
                >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                    <span>{isPlaying ? "Pause" : "Listen"}</span>
                </Button>
                {isOwner && (
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border sm:h-9 sm:w-9 hover:border-primary/50 transition-colors"
                            onClick={() => onEdit(audio)}
                        >
                            <Pencil className="h-3 w-3.5 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-border hover:bg-destructive hover:text-white sm:h-9 sm:w-9 transition-colors"
                            onClick={() => onDelete(audio)}
                        >
                            <Trash2 className="h-3 w-3.5 sm:h-3.5 sm:w-3.5" />
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
