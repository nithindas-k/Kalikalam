import { useState, useRef, useEffect } from "react";
import { Video as VideoIcon, Upload, Loader2, Check, Lock, Unlock, Copy, Key, Scissors, Image as ImageIcon, Camera, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { MESSAGES } from "@/constants/messages";
import type { VideoItem } from "@/types/video.types";
import { toast } from "sonner";
import ImageCropDialog from "./ImageCropDialog";

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

    // Cropping State
    const [cropImage, setCropImage] = useState<string | null>(null);

    // Trimming State
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            setThumbnailFile(null);
            if (!isEdit) setThumbnailPreviewUrl("");
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCropImage(url);
        }
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "thumbnail.jpg", { type: "image/jpeg" });
        setThumbnailFile(file);
        const url = URL.createObjectURL(croppedBlob);
        setThumbnailPreviewUrl(url);
        toast.success("Thumbnail cropped and updated!");
    };

    const captureThumbnail = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                setCropImage(url);
            }
        }, "image/jpeg", 0.9);
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
        <form onSubmit={handleSubmit} className="space-y-8">
            <canvas ref={canvasRef} className="hidden" />

            {cropImage && (
                <ImageCropDialog
                    image={cropImage}
                    open={!!cropImage}
                    onClose={() => setCropImage(null)}
                    onCropComplete={handleCropComplete}
                    aspectRatio={16 / 9}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Details */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Video Title</Label>
                        <Input
                            id="name"
                            placeholder="Give your masterpiece a name..."
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setErrors((prev) => ({ ...prev, name: "" }));
                            }}
                            className={cn(
                                "h-12 text-sm bg-secondary/20 border-white/5 focus:border-primary/50 transition-all rounded-xl",
                                errors.name ? "border-destructive/50" : ""
                            )}
                        />
                        {errors.name && <p className="text-[10px] text-destructive ml-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Content Visibility</Label>
                        <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <button
                                type="button"
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-300",
                                    !isPrivate ? "bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.3)] font-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}
                                onClick={() => setIsPrivate(false)}
                            >
                                <Unlock className="h-4 w-4" />
                                <span className="text-[10px] uppercase tracking-widest">Public</span>
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all duration-300",
                                    isPrivate ? "bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.3)] font-black" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}
                                onClick={() => setIsPrivate(true)}
                            >
                                <Lock className="h-4 w-4" />
                                <span className="text-[10px] uppercase tracking-widest">Private</span>
                            </button>
                        </div>

                        {isPrivate && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-4 overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Lock className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="mb-2 text-[10px] font-black text-primary/70 uppercase tracking-widest">Secret Access Key</p>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className="flex h-12 flex-1 items-center gap-3 rounded-xl bg-black/60 px-4 border border-white/10">
                                            <Key className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-black tracking-widest text-primary font-mono">{accessKey}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            className="h-12 w-12 border-white/10 bg-black/60 hover:bg-primary hover:text-black transition-all rounded-xl"
                                            onClick={copyToClipboard}
                                        >
                                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Manual Thumbnail Upload */}
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                            Cover Picture
                            {thumbnailPreviewUrl && (
                                <button
                                    type="button"
                                    onClick={() => setCropImage(thumbnailPreviewUrl)}
                                    className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                >
                                    <Crop className="w-3 h-3" />
                                    Edit Crop
                                </button>
                            )}
                        </Label>
                        <div
                            className={cn(
                                "relative group cursor-pointer aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-300",
                                thumbnailPreviewUrl
                                    ? "border-primary/20 hover:border-primary/40"
                                    : "border-white/10 hover:border-primary/40 bg-black/40 flex flex-col items-center justify-center"
                            )}
                            onClick={() => thumbInputRef.current?.click()}
                        >
                            {thumbnailPreviewUrl ? (
                                <>
                                    <img src={thumbnailPreviewUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Thumbnail Preview" />
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 scale-90 group-hover:scale-100 transition-transform">
                                            <ImageIcon className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Change Cover</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                        <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Upload Cover</span>
                                    <span className="text-[8px] text-muted-foreground/60 mt-2 text-center px-6 italic">Capture from video or upload custom</span>
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
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Video Source</Label>
                    {!videoPreviewUrl ? (
                        <div
                            className={cn(
                                "relative group flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300",
                                errors.video
                                    ? "border-destructive/40 bg-destructive/5"
                                    : "border-white/10 bg-black/40 hover:border-primary/40 hover:bg-secondary/5"
                            )}
                            onClick={() => inputRef.current?.click()}
                        >
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <VideoIcon className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">Select Video File</span>
                            <span className="text-[8px] text-muted-foreground/60 mt-2 font-medium">MP4, WebM or OGG supported</span>

                            {errors.video && (
                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <span className="text-[8px] font-black uppercase text-destructive tracking-widest leading-none bg-destructive/10 px-2 py-1 rounded-full">{errors.video}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="rounded-2xl overflow-hidden bg-black aspect-video relative border border-white/10 shadow-2xl group/player ring-1 ring-white/5">
                                <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none">
                                    <video src={videoPreviewUrl} className="h-full w-full object-cover opacity-20 blur-2xl scale-125" muted />
                                </div>
                                <video
                                    ref={videoRef}
                                    src={videoPreviewUrl}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                    controls
                                    className="relative w-full h-full object-contain z-10"
                                />

                                <div className="absolute top-4 right-4 opacity-0 group-hover/player:opacity-100 transition-all duration-300 translate-y-1 group-hover/player:translate-y-0 z-20">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-10 px-4 bg-black/70 backdrop-blur-xl border border-white/10 text-white hover:bg-primary hover:text-black gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl"
                                        onClick={captureThumbnail}
                                    >
                                        <Camera className="w-4 h-4" />
                                        Snap Frame
                                    </Button>
                                </div>
                            </div>

                            {duration > 0 && videoFile && (
                                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl space-y-5 border border-white/5 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Scissors className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">TIMELINE TRIM</span>
                                        </div>
                                        <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-[10px] font-mono font-bold text-primary tracking-tighter">{formatTime(endTime - startTime)} selected</span>
                                        </div>
                                    </div>

                                    <div className="px-1">
                                        <Slider
                                            value={[startTime, endTime]}
                                            max={duration}
                                            step={0.1}
                                            onValueChange={handleSliderChange}
                                            className="pt-1 pb-1"
                                        />
                                    </div>

                                    <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">
                                        <div className="flex flex-col gap-1">
                                            <span className="opacity-50">Start</span>
                                            <span className="text-foreground">{formatTime(startTime)}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="opacity-50">End</span>
                                            <span className="text-foreground">{formatTime(endTime)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-12 text-[10px] rounded-xl border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all font-black uppercase tracking-widest bg-black/20"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    Swap Video
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 h-12 text-[10px] rounded-xl bg-white/5 hover:bg-white/10 transition-all font-black uppercase tracking-widest border border-white/10 group"
                                    onClick={captureThumbnail}
                                >
                                    <Camera className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                                    Snap Cover
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
                        <span>{uploadProgress < 100 ? "Sending Files..." : "Finalizing..."}</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 shadow-sm" />
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-white/5">
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 h-14 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 transition-all"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Discard
                </Button>
                <Button
                    type="submit"
                    className="flex-[2] gap-3 font-black h-14 text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] group relative overflow-hidden"
                    disabled={loading}
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="relative z-10">{uploadProgress < 100 ? "Uploading Metadata..." : "Processing Assets..."}</span>
                        </>
                    ) : (
                        <>
                            {isEdit ? <Check className="w-4 h-4 translate-z-0" /> : <Upload className="w-4 h-4" />}
                            <span className="relative z-10">{isEdit ? "Update Project" : "Publish to Feed"}</span>
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
