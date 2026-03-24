import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/utils/imageCrop";

interface ImageCropDialogProps {
    image: string;
    open: boolean;
    onClose: () => void;
    onCropComplete: (croppedImage: Blob) => void;
    aspectRatio?: number;
    title?: string;
}

export default function ImageCropDialog({ image, open, onClose, onCropComplete, aspectRatio = 16 / 9, title = "Crop Image" }: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-black border-white/10">
                <DialogHeader className="p-4 border-b border-white/10">
                    <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
                </DialogHeader>

                <div className="relative h-[350px] w-full bg-[#111]">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 space-y-6 bg-background">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            <span>Zoom Level</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(values) => setZoom(values[0])}
                        />
                    </div>

                    <DialogFooter className="flex gap-3 mt-2">
                        <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl uppercase text-[10px] font-black tracking-widest h-11">
                            Cancel
                        </Button>
                        <Button onClick={handleCrop} className="flex-1 bg-primary text-black hover:bg-primary/90 rounded-xl uppercase text-[10px] font-black tracking-widest h-11">
                            Save Crop
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
