import { useRef, useState, useEffect } from "react";
import { Play, Pause, X, SkipBack, SkipForward, Maximize } from "lucide-react";
import type { VideoItem } from "@/types/video.types";
import { Slider } from "@/components/ui/slider";

interface VideoPlayerProps {
    video: VideoItem;
    isPaused: boolean;
    onTogglePause: () => void;
    onClose: () => void;
}

function formatTime(t: number): string {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export default function VideoPlayer({ video, isPaused, onTogglePause, onClose }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        // Reset and play on new track
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => { });
        }
    }, [video.id]);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        if (isPaused) {
            el.pause();
        } else {
            el.play().catch(() => { });
        }
    }, [isPaused]);

    const seek = (values: number[]) => {
        const t = values[0];
        setCurrentTime(t);
        if (videoRef.current) videoRef.current.currentTime = t;
    };

    const skip = (seconds: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    }

    return (
        <div className="player-slide-up fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full h-auto p-4 gap-4 max-w-7xl mx-auto">
                <div className="w-full sm:w-1/3 flex items-center justify-center p-2">
                    <video
                        ref={videoRef}
                        src={video.videoUrl}
                        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
                        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
                        onEnded={onTogglePause}
                        className="w-full h-auto max-h-[150px] rounded-lg shadow-xl cursor-pointer"
                        onClick={onTogglePause}
                        poster={video.thumbnailUrl}
                    />
                </div>

                <div className="w-full sm:w-2/3 flex flex-col gap-3">
                    <div className="flex items-center justify-between w-full">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">{video.name}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 w-full justify-center">
                        <button onClick={() => skip(-10)} className="p-2 rounded-lg hover:bg-muted"><SkipBack className="w-5 h-5" /></button>
                        <button
                            onClick={onTogglePause}
                            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black shadow-lg hover:scale-105 transition-all"
                        >
                            {!isPaused ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
                        </button>
                        <button onClick={() => skip(10)} className="p-2 rounded-lg hover:bg-muted"><SkipForward className="w-5 h-5" /></button>
                        <button onClick={toggleFullscreen} className="p-2 ml-4 rounded-lg hover:bg-muted text-muted-foreground"><Maximize className="w-5 h-5" /></button>
                    </div>

                    <div className="flex items-center gap-3 w-full px-2">
                        <span className="text-[10px] w-8 text-right text-muted-foreground">{formatTime(currentTime)}</span>
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={0.1}
                            onValueChange={seek}
                            className="w-full"
                        />
                        <span className="text-[10px] w-8 text-muted-foreground">{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
