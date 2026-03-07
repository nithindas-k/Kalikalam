import { useState, useRef, useEffect } from "react";
import { ImagePlus, Music, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MESSAGES } from "@/constants/messages";
import type { AudioItem } from "@/types/audio.types";

interface AudioFormProps {
    initialData?: AudioItem;
    onSubmit: (name: string, image: File | null, audio: File | null) => Promise<boolean>;
    onCancel: () => void;
}

export default function AudioForm({ initialData, onSubmit, onCancel }: AudioFormProps) {
    const [name, setName] = useState(initialData?.name ?? "");
    const [image, setImage] = useState<File | null>(null);
    const [audio, setAudio] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl ?? "");
    const [audioName, setAudioName] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const imageRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLInputElement>(null);

    const isEdit = !!initialData;

    useEffect(() => {
        return () => {
            if (imagePreview && !initialData?.imageUrl) {
                URL.revokeObjectURL(imagePreview);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setErrors((prev) => ({ ...prev, image: "" }));
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
        const success = await onSubmit(name.trim(), image, audio);
        setLoading(false);
        if (success) onCancel();
    };

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
