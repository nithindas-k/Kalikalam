import { useRef, useState, useEffect } from "react";
import { Play, Pause, X, SkipBack, SkipForward, Volume2 } from "lucide-react";
import type { AudioItem } from "@/types/audio.types";

interface AudioPlayerProps {
    audio: AudioItem;
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

export default function AudioPlayer({ audio, isPaused, onTogglePause, onClose }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    useEffect(() => {
        // Reset and play on new track
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        }
    }, [audio.id]);

    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;
        if (isPaused) {
            el.pause();
        } else {
            el.play().catch(() => { });
        }
    }, [isPaused]);

    const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = Number(e.target.value);
        setCurrentTime(t);
        if (audioRef.current) audioRef.current.currentTime = t;
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Number(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    const skip = (seconds: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="player-slide-up fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/20">
            <audio
                ref={audioRef}
                src={audio.audioUrl}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
                onEnded={onTogglePause}
            />

            {/* Progress bar */}
            <div className="w-full h-1 bg-muted relative group">
                <div
                    className="absolute left-0 top-0 h-full bg-primary transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                />
                <input
                    type="range"
                    className="orange-range absolute inset-0 w-full opacity-0 cursor-pointer h-1 z-10"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    step={0.1}
                    onChange={seek}
                />
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
                {/* Person info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                        <img
                            src={audio.imageUrl}
                            alt={audio.name}
                            className="w-10 h-10 rounded-lg object-cover border border-border sm:w-12 sm:h-12"
                        />
                        {!isPaused && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-black" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{audio.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => skip(-10)}
                        className="hidden xs:flex p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Back 10s"
                    >
                        <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onTogglePause}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary flex items-center justify-center text-black hover:bg-primary/90 transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-primary/20"
                    >
                        {!isPaused ? (
                            <Pause className="w-4 h-4 fill-black sm:w-5 sm:h-5" />
                        ) : (
                            <Play className="w-4 h-4 fill-black ml-0.5 sm:w-5 sm:h-5" />
                        )}
                    </button>

                    <button
                        onClick={() => skip(10)}
                        className="hidden xs:flex p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Forward 10s"
                    >
                        <SkipForward className="w-4 h-4" />
                    </button>
                </div>

                {/* Desktop elements - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-2 w-32 ml-4">
                    <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                        type="range"
                        className="orange-range w-full"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={handleVolumeChange}
                    />
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="p-2 sm:p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-1 sm:ml-2"
                    title="Close player"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </div>
    );
}
