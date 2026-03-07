import { useState, useRef, useEffect, useCallback } from "react";
import { ImagePlus, Music, Upload, Loader2, Check, RefreshCw, Lock, Unlock, Copy, Key } from "lucide-react";
import Cropper from "react-easy-crop";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MESSAGES } from "@/constants/messages";
import type { AudioItem } from "@/types/audio.types";
import getCroppedImg from "@/lib/cropUtils";
import { toast } from "sonner";

interface AudioFormProps {
    initialData?: AudioItem;
    onSubmit: (name: string, image: File | null, audio: File | null, isPrivate: boolean, accessKey: string) => Promise<boolean>;
    onCancel: () => void;
}

export default function AudioForm({ initialData, onSubmit, onCancel }: AudioFormProps) {
    const [name, setName] = useState(initialData?.name ?? "");
    const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate ?? false);
    const [accessKey, setAccessKey] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [audio, setAudio] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl ?? "");
    const [audioName, setAudioName] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Cropper states
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const imageRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLInputElement>(null);

    const isEdit = !!initialData;

    // Generate key on mount or when switched to private
    useEffect(() => {
        if (isPrivate && !accessKey) {
            const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
            setAccessKey(newKey);
        }
    }, [isPrivate, accessKey]);

    useEffect(() => {
        return () => {
            if (imagePreview && !initialData?.imageUrl) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview, initialData?.imageUrl]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(accessKey);
        setCopied(true);
        toast.success("Key copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = MESSAGES.NAME_REQUIRED;
        if (!isEdit && !image) errs.image = MESSAGES.IMAGE_REQUIRED;
        if (!isEdit && !audio) errs.audio = MESSAGES.AUDIO_REQUIRED;
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setTempImage(reader.result as string);
            };
        }
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        if (tempImage && croppedAreaPixels) {
            try {
                const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
                if (croppedBlob) {
                    const croppedFile = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
                    setImage(croppedFile);
                    if (imagePreview && !initialData?.imageUrl) {
                        URL.revokeObjectURL(imagePreview);
                    }
                    setImagePreview(URL.createObjectURL(croppedFile));
                    setTempImage(null);
                    setErrors((prev) => ({ ...prev, image: "" }));
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudio(file);
            setAudioName(file.name);
            setErrors((prev) => ({ ...prev, audio: "" }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        const success = await onSubmit(name.trim(), image, audio, isPrivate, accessKey);
        setLoading(false);
        if (success) {
            if (isPrivate) {
                // Keep modal open briefly to show the key if private upload? 
                // Actually, toast already copied it. Let's close it as normal.
            }
            onCancel();
        }
    };

    if (tempImage) {
        return (
            <div className="flex flex-col gap-4">
                <div className="relative w-full h-64 sm:h-80 bg-black rounded-xl overflow-hidden shadow-inner border border-border/50">
                    <Cropper
                        image={tempImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5 px-1">
                        <Label className="text-xs text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</Label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="orange-range"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 gap-2 h-10 text-sm font-medium"
                            onClick={() => setTempImage(null)}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="flex-1 gap-2 h-10 text-sm font-bold"
                            onClick={handleCropSave}
                        >
                            <Check className="w-4 h-4" />
                            Use Photo
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs sm:text-sm">Person's Name</Label>
                <Input
                    id="name"
                    placeholder="e.g. Sijo Varghese"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={cn("h-9 sm:h-10 text-sm", errors.name ? "border-destructive" : "")}
                />
                {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
            </div>

            {/* Visibility Toggle */}
            {!isEdit && (
                <div className="space-y-2.5">
                    <Label className="text-xs sm:text-sm">Visibility Settings</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant={!isPrivate ? "default" : "outline"}
                            className={cn(
                                "h-11 flex-col items-center justify-center gap-1 rounded-xl border-border/50 px-3",
                                !isPrivate ? "bg-primary text-black shadow-lg" : "text-muted-foreground"
                            )}
                            onClick={() => setIsPrivate(false)}
                        >
                            <Unlock className="h-4 w-4" />
                            <span className="text-[10px] font-bold">Public Content</span>
                        </Button>
                        <Button
                            type="button"
                            variant={isPrivate ? "default" : "outline"}
                            className={cn(
                                "h-11 flex-col items-center justify-center gap-1 rounded-xl border-border/50 px-3",
                                isPrivate ? "bg-primary text-black shadow-lg" : "text-muted-foreground"
                            )}
                            onClick={() => setIsPrivate(true)}
                        >
                            <Lock className="h-4 w-4" />
                            <span className="text-[10px] font-bold">Private Content</span>
                        </Button>
                    </div>

                    {isPrivate && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="relative rounded-xl border border-primary/20 bg-primary/5 p-3">
                                <p className="mb-2 text-[10px] font-medium text-primary uppercase tracking-tight">Access Key (Required to Unlock)</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 flex-1 items-center gap-3 rounded-lg bg-black/40 px-3 border border-white/10">
                                        <Key className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-black tracking-widest text-primary font-mono">{accessKey}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="h-10 w-10 border-white/10 bg-black/40 hover:bg-black/60 active:scale-90"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="mt-2 text-[9px] text-muted-foreground italic flex items-center gap-1">
                                    <Check className="h-3 w-3 text-primary" /> Share this key with people who should see this clip.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Image */}
            <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Person's Photo</Label>
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-primary/60",
                        errors.image ? "border-destructive/60" : "border-border"
                    )}
                    onClick={() => imageRef.current?.click()}
                >
                    {imagePreview ? (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-32 sm:h-48 object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 rounded-xl transition-opacity">
                                <p className="text-white text-xs font-medium">Click to change</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-24 sm:h-36 gap-1 text-muted-foreground">
                            <ImagePlus className="w-6 h-6 sm:w-8 sm:h-8" />
                            <span className="text-xs">Click to upload photo</span>
                        </div>
                    )}
                </div>
                <input
                    ref={imageRef}
                    type="file"
                    accept="image/jpg,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                />
                {errors.image && <p className="text-[10px] text-destructive">{errors.image}</p>}
            </div>

            {/* Audio */}
            <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Comedy Audio</Label>
                <div
                    className={cn(
                        "border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-primary/60",
                        errors.audio ? "border-destructive/60" : audioName ? "border-primary/40 bg-primary/5" : "border-border"
                    )}
                    onClick={() => audioRef.current?.click()}
                >
                    <div className="flex items-center gap-2.5 p-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 sm:w-10 sm:h-10",
                            audioName ? "bg-primary text-black" : "bg-muted text-muted-foreground"
                        )}>
                            <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            {audioName ? (
                                <>
                                    <p className="text-xs font-medium text-foreground truncate">{audioName}</p>
                                    <p className="text-[10px] text-muted-foreground">Click to change</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-muted-foreground">Click to upload audio</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <input
                    ref={audioRef}
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/*"
                    className="hidden"
                    onChange={handleAudioChange}
                />
                {errors.audio && <p className="text-[10px] text-destructive">{errors.audio}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1 sm:gap-3">
                <Button type="button" variant="outline" className="flex-1 h-9 sm:h-10 text-xs sm:text-sm" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2 font-bold h-9 sm:h-10 text-xs sm:text-sm" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isEdit ? "Save" : "Upload"}</span>
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
