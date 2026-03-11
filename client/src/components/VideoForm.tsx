import { useState, useRef, useEffect } from "react";
import { Video as VideoIcon, Upload, Loader2, Check, Lock, Unlock, Copy, Key, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MESSAGES } from "@/constants/messages";
import type { VideoItem } from "@/types/video.types";
import { toast } from "sonner";

interface VideoFormProps {
    initialData?: VideoItem;
    onSubmit: (name: string, video: File | undefined, startTime: number, endTime: number, isPrivate: boolean, accessKey: string) => Promise<boolean>;
    onCancel: () => void;
}

export default function VideoForm({ initialData, onSubmit, onCancel }: VideoFormProps) {
    const [name, setName] = useState(initialData?.name ?? "");
    const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate ?? false);
    const [accessKey, setAccessKey] = useState(initialData?.accessKey ?? "");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>(initialData?.videoUrl ?? "");

    // Trimming State
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const isEdit = !!initialData;

    useEffect(() => {
        if (isPrivate && !accessKey) {
            regenerateKey();
        }
    }, [isPrivate, accessKey]);

    useEffect(() => {
        return () => {
            // Only revoke if it's a blob url
            if (videoPreviewUrl && videoPreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(videoPreviewUrl);
            }
        };
    }, [videoPreviewUrl]);

    const regenerateKey = () => {
        const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
        setAccessKey(newKey);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(accessKey);
        setCopied(true);
        toast.success("Key copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = MESSAGES.NAME_REQUIRED;
        if (!isEdit && !videoFile) errs.video = "Video file is required";
        if (endTime > 0 && startTime >= endTime) errs.trim = "Start time must be before end time";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setErrors((prev) => ({ ...prev, video: "" }));
            const url = URL.createObjectURL(file);
            setVideoPreviewUrl(url);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const videoDuration = videoRef.current.duration;
            setDuration(videoDuration);
            setEndTime(videoDuration);
            setStartTime(0);
        }
    };

    const handleSliderChange = (values: number[]) => {
        setStartTime(values[0]);
        setEndTime(values[1]);
        if (videoRef.current) {
            videoRef.current.currentTime = values[0];
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        // If the user hasn't moved the sliders, or it's the full duration, we use -1 for endTime to signal "Full Upload" to backend
        // Actually, backend now checks if it should trim based on startTime and endTime ranges.
        // If startTime is 0 and endTime is close to duration, we can pass 0 and -1 to avoid trimming.
        let finalStart = startTime;
        let finalEnd = endTime;

        // No trimming if it's the full length
        if (startTime === 0 && (endTime === duration || endTime === 0)) {
            finalEnd = 999999; // Large number or special signal
        }

        const success = await onSubmit(name.trim(), videoFile || undefined, finalStart, finalEnd, isPrivate, accessKey);
        setLoading(false);
        if (success) {
            onCancel();
        }
    };

    const formatTime = (timeInSeconds: number) => {
        if (!isFinite(timeInSeconds)) return "0:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Person's Name */}
            <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs sm:text-sm">Video Title</Label>
                <Input
                    id="name"
                    placeholder="e.g. Awesome Video Clip"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={cn("h-9 sm:h-10 text-sm", errors.name ? "border-destructive" : "")}
                />
                {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
            </div>

            {/* Visibility Settings - Segmented Control Style */}
            <div className="space-y-3">
                <Label className="text-xs sm:text-sm font-bold text-foreground">Content Visibility</Label>
                <div className="flex p-1 bg-secondary/50 rounded-2xl border border-border/50">
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-300",
                            !isPrivate ? "bg-primary text-black shadow-lg font-bold" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setIsPrivate(false)}
                    >
                        <Unlock className={cn("h-4 w-4", !isPrivate ? "animate-in zoom-in" : "")} />
                        <span className="text-xs">Public</span>
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-300",
                            isPrivate ? "bg-primary text-black shadow-lg font-bold" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setIsPrivate(true)}
                    >
                        <Lock className={cn("h-4 w-4", isPrivate ? "animate-in zoom-in" : "")} />
                        <span className="text-xs">Private</span>
                    </button>
                </div>

                {isPrivate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-inner overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-[0.03]">
                                <Key className="h-16 w-16 -mr-4 -mt-4 text-primary" />
                            </div>
                            <p className="mb-3 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Shareable Access Key</p>
                            <div className="flex items-center gap-2">
                                <div className="flex h-12 flex-1 items-center gap-3 rounded-xl bg-black/40 px-4 border border-white/10 shadow-lg group/keybox hover:border-primary/30 transition-colors">
                                    <Key className="h-4 w-4 text-primary mt-0.5" />
                                    <span className="text-base font-black tracking-[0.3em] text-primary font-mono select-all">
                                        {accessKey}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-12 w-12 border-white/10 bg-black/40 hover:bg-black/60 rounded-xl transition-all"
                                    onClick={copyToClipboard}
                                    title="Copy Key"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Upload & Trimming */}
            <div className="space-y-3">
                <Label className="text-xs sm:text-sm">Video File</Label>

                {!videoPreviewUrl ? (
                    <div
                        className={cn(
                            "flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-primary/60",
                            errors.video ? "border-destructive/60" : "border-border"
                        )}
                        onClick={() => inputRef.current?.click()}
                    >
                        <VideoIcon className="w-10 h-10 mb-2 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload video</span>
                        <span className="text-xs text-muted-foreground mt-1">MP4, WebM, or OGG</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl overflow-hidden bg-black relative border border-white/5">
                            <video
                                ref={videoRef}
                                src={videoPreviewUrl}
                                onLoadedMetadata={handleLoadedMetadata}
                                controls
                                className="w-full h-auto max-h-[50vh] object-contain"
                            />
                        </div>

                        {duration > 0 && videoFile && (
                            <div className="bg-secondary/30 p-4 rounded-xl space-y-4 border border-border/50 animate-in zoom-in duration-500">
                                <div className="flex items-center justify-between text-xs font-black text-primary uppercase tracking-widest">
                                    <span className="flex items-center gap-2">
                                        <Scissors className="w-4 h-4" />
                                        Trim Selection
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatTime(endTime - startTime)}
                                    </span>
                                </div>
                                <Slider
                                    value={[startTime, endTime]}
                                    max={duration}
                                    step={0.1}
                                    onValueChange={handleSliderChange}
                                    className="pt-2 pb-2"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                    <span>{formatTime(startTime)}</span>
                                    <span>{formatTime(endTime)}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 text-xs rounded-xl border-dashed hover:bg-primary/10 hover:text-primary transition-all font-bold uppercase tracking-wider"
                                onClick={() => inputRef.current?.click()}
                            >
                                {isEdit ? "Replace Video" : "Change Video"}
                            </Button>
                        </div>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    className="hidden"
                    onChange={handleVideoChange}
                />
                {errors.video && <p className="text-[10px] text-destructive">{errors.video}</p>}
                {errors.trim && <p className="text-[10px] text-destructive">{errors.trim}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1 sm:gap-3">
                <Button type="button" variant="outline" className="flex-1 h-11 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2 font-black h-11 text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 bg-primary text-black hover:bg-primary/95 transition-all active:scale-95" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            {isEdit ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                            <span>{isEdit ? "Update Video" : "Upload Video"}</span>
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
