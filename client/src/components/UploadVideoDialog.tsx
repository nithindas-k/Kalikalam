import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import VideoForm from "./VideoForm";
import type { VideoItem } from "@/types/video.types";

interface UploadVideoDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string, video: File | undefined, startTime: number, endTime: number, isPrivate: boolean, accessKey: string) => Promise<boolean>;
    video?: VideoItem;
}

export default function UploadVideoDialog({ open, onClose, onSubmit, video }: UploadVideoDialogProps) {
    const isEdit = !!video;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] rounded-2xl mx-auto shadow-2xl border-border/50">
                <DialogHeader className="mb-4 sm:mb-6 flex flex-col items-center text-center space-y-3">
                    <div>
                        <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                            {isEdit ? "Edit Video" : "Upload Video"}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                            {isEdit ? "Change your video details below." : "Cut the best part and share it with the world."}
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <VideoForm initialData={video} onSubmit={onSubmit} onCancel={onClose} />
            </DialogContent>
        </Dialog>
    );
}
