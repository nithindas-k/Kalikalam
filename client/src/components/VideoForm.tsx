import { useState, useRef, useEffect } from "react";
import { Video as VideoIcon, Upload, Loader2, Check, Lock, Unlock, Copy, Key, Scissors, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { MESSAGES } from "@/constants/messages";
import type { VideoItem } from "@/types/video.types";
import { toast } from "sonner";

interface VideoFormProps {
    initialData?: VideoItem;
    onSubmit: (
        name: string,
        video: File | undefined,
        startTime: number,
        endTime: number,
        isPrivate: boolean,
        accessKey: string,
        onProgress?: (progress: number) => void,
        thumbnail?: File
    ) => Promise<boolean>;
    onCancel: () => void;
}

export default function VideoForm({ initialData, onSubmit, onCancel }: VideoFormProps) {
    const [name, setName] = useState(initialData?.name ?? "");
    const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate ?? false);
    const [accessKey, setAccessKey] = useState(initialData?.accessKey ?? "");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>(initialData?.videoUrl ?? "");

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>(initialData?.thumbnailUrl ?? "");

    // Trimming State
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [copied, setCopied] = useState(false);

    const isEdit = !!initialData;

    useEffect(() => {
        if (isPrivate && !accessKey) {
            regenerateKey();
        }
    }, [isPrivate, accessKey]);

    useEffect(() => {
        return () => {
            if (videoPreviewUrl && videoPreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(videoPreviewUrl);
            }
            if (thumbnailPreviewUrl && thumbnailPreviewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(thumbnailPreviewUrl);
            }
        };
    }, [videoPreviewUrl, thumbnailPreviewUrl]);

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

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            const url = URL.createObjectURL(file);
            setThumbnailPreviewUrl(url);
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

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            if (videoRef.current.currentTime >= endTime) {
                videoRef.current.currentTime = startTime;
            }
            if (videoRef.current.currentTime < startTime) {
                videoRef.current.currentTime = startTime;
            }
        }
    };

    const handleSliderChange = (values: number[]) => {
        setStartTime(values[0]);
        setEndTime(values[1]);
        if (videoRef.current) {
            videoRef.current.currentTime = values[0];
            if (videoRef.current.paused) {
                videoRef.current.play().catch(() => { });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setUploadProgress(0);

        let finalStart = startTime;
        let finalEnd = endTime;

        if (startTime === 0 && (endTime === duration || endTime === 0)) {
            finalEnd = 999999;
        }

        const success = await onSubmit(
            name.trim(),
            videoFile || undefined,
            finalStart,
            finalEnd,
            isPrivate,
            accessKey,
            (progress) => setUploadProgress(progress),
            thumbnailFile || undefined
        );

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Details */}
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs sm:text-sm font-bold">Video Title</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Awesome Video Clip"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrors((prev) => ({ ...prev, name: "" }));
                            }}
                            className={cn("h-10 text-sm bg-black/20 border-white/10", errors.name ? "border-destructive" : "")}
                        />
                        {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs sm:text-sm font-bold text-foreground">Content Visibility</Label>
                        <div className="flex p-1 bg-secondary/30 rounded-2xl border border-white/5">
                            <button
                                type="button"
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl transition-all duration-300",
                                    !isPrivate ? "bg-primary text-black shadow-lg font-bold" : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setIsPrivate(false)}
                            >
                                <Unlock className="h-4 w-4" />
                                <span className="text-xs">Public</span>
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl transition-all duration-300",
                                    isPrivate ? "bg-primary text-black shadow-lg font-bold" : "text-muted-foreground hover:text-foreground"
                                )}
                                onClick={() => setIsPrivate(true)}
                            >
                                <Lock className="h-4 w-4" />
                                <span className="text-xs">Private</span>
                            </button>
                        </div>

                        {isPrivate && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-4 overflow-hidden">
                                    <p className="mb-2 text-[10px] font-black text-primary uppercase tracking-widest">Access Key</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-11 flex-1 items-center gap-3 rounded-xl bg-black/40 px-3 border border-white/10">
                                            <Key className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-black tracking-widest text-primary font-mono">{accessKey}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            className="h-11 w-11 border-white/10 bg-black/40"
                                            onClick={copyToClipboard}
                                        >
                                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manual Thumbnail Upload */}
                    <div className="space-y-3">
                        <Label className="text-xs sm:text-sm font-bold">Custom Thumbnail (Optional)</Label>
                        <div
                            className={cn(
                                "relative group cursor-pointer aspect-video rounded-xl overflow-hidden border-2 border-dashed transition-all hover:bg-secondary/10",
                                thumbnailPreviewUrl ? "border-primary/30" : "border-white/10 h-32 flex flex-col items-center justify-center"
                            )}
                            onClick={() => thumbInputRef.current?.click()}
                        >
                            {thumbnailPreviewUrl ? (
                                <>
                                    <img src={thumbnailPreviewUrl} className="w-full h-full object-cover" alt="Thumbnail Preview" />
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ImageIcon className="w-8 h-8 mb-2 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-white">Change Image</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-6 h-6 mb-2 text-muted-foreground" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upload Cover Image</span>
                                </>
                            )}
                        </div>
                        <input
                            ref={thumbInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleThumbnailChange}
                        />
                    </div>
                </div>

                {/* Right Column - Video Player & Trim */}
                <div className="space-y-4">
                    <Label className="text-xs sm:text-sm font-bold">Video Processing</Label>
                    {!videoPreviewUrl ? (
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center h-full min-h-[12rem] border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-primary/60 bg-black/20",
                                errors.video ? "border-destructive/60" : "border-white/10"
                            )}
                            onClick={() => inputRef.current?.click()}
                        >
                            <VideoIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                            <span className="text-xs font-bold uppercase tracking-widest">Select Video</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl overflow-hidden bg-black aspect-video relative border border-white/5 ring-1 ring-white/10">
                                <div className="absolute inset-0 h-full w-full overflow-hidden">
                                    <video src={videoPreviewUrl} className="h-full w-full object-cover opacity-30 blur-md scale-110" muted />
                                </div>
                                <video
                                    ref={videoRef}
                                    src={videoPreviewUrl}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                    controls
                                    className="relative w-full h-full object-contain"
                                />
                            </div>

                            {duration > 0 && videoFile && (
                                <div className="bg-secondary/20 p-4 rounded-xl space-y-4 border border-white/5">
                                    <div className="flex items-center justify-between text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                        <span className="flex items-center gap-2">
                                            <Scissors className="w-3.5 h-3.5" />
                                            TRIM ({formatTime(endTime - startTime)})
                                        </span>
                                    </div>
                                    <Slider
                                        value={[startTime, endTime]}
                                        max={duration}
                                        step={0.1}
                                        onValueChange={handleSliderChange}
                                        className="pt-1 pb-1"
                                    />
                                    <div className="flex justify-between text-[8px] font-bold text-muted-foreground">
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
                                    className="h-8 px-4 text-[10px] rounded-xl border-dashed border-white/20 hover:border-primary/40 hover:bg-primary/5 transition-all font-bold uppercase tracking-widest"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    {isEdit ? "Update File" : "Pick Another"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                className="hidden"
                onChange={handleVideoChange}
            />

            {/* Upload Progress Section */}
            {loading && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                        <span>{uploadProgress < 100 ? "Uploading Data" : "Finalizing Video"}</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 shadow-sm" />
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 h-12 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Discard
                </Button>
                <Button
                    type="submit"
                    className="flex-[2] gap-3 font-black h-12 text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-95"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{uploadProgress < 100 ? "Syncing..." : "Processing..."}</span>
                        </>
                    ) : (
                        <>
                            {isEdit ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                            <span>{isEdit ? "Update Master" : "Confirm Upload"}</span>
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
