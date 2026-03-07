import { Play, Pencil, Trash2, Clock, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AudioItem } from "@/types/audio.types";
import { cn } from "@/lib/utils";

interface AudioCardProps {
    audio: AudioItem;
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

export default function AudioCard({ audio, isPlaying, onPlay, onEdit, onDelete }: AudioCardProps) {
    return (
        <Card className={cn(
            "group relative overflow-hidden border-border bg-card transition-all duration-300",
            isPlaying ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"
        )}>
            {/* Thumbnail Area */}
            <div
                className="relative aspect-square w-full cursor-pointer overflow-hidden"
                onClick={() => onPlay(audio)}
            >
                <img
                    src={audio.imageUrl}
                    alt={audio.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Play Overlay */}
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300",
                    isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black shadow-lg">
                        {isPlaying ? (
                            <Pause className="h-6 w-6 fill-black" />
                        ) : (
                            <Play className="ml-1 h-6 w-6 fill-black" />
                        )}
                    </div>
                </div>

                {/* Status Badge */}
                {isPlaying && (
                    <div className="absolute left-2 top-2">
                        <Badge variant="default" className="bg-primary text-black font-bold">
                            Playing
                        </Badge>
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
                    className="h-8 flex-1 gap-1.5 text-[10px] font-bold sm:h-9 sm:text-xs"
                    onClick={() => onPlay(audio)}
                >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                    <span>{isPlaying ? "Pause" : "Listen"}</span>
                </Button>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-border sm:h-9 sm:w-9"
                        onClick={() => onEdit(audio)}
                    >
                        <Pencil className="h-3 w-3.5 sm:h-3.5 sm:w-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-border hover:bg-destructive hover:text-white sm:h-9 sm:w-9"
                        onClick={() => onDelete(audio)}
                    >
                        <Trash2 className="h-3 w-3.5 sm:h-3.5 sm:w-3.5" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
