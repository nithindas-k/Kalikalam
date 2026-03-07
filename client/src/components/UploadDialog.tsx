import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import AudioForm from "@/components/AudioForm";
import type { AudioItem } from "@/types/audio.types";

interface UploadDialogProps {
    open: boolean;
    mode: "add" | "edit";
    audio?: AudioItem;
    onClose: () => void;
    onSubmit: (name: string, image: File | null, audio: File | null, isPrivate: boolean, accessKey: string) => Promise<boolean>;
}

export default function UploadDialog({ open, mode, audio, onClose, onSubmit }: UploadDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-[95vw] rounded-2xl p-5 sm:max-w-lg sm:p-6 overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {mode === "add" ? "Add New Clip" : "Edit Clip"}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        {mode === "add"
                            ? "Upload a photo, audio and name for your friend."
                            : "Update the clip details below."}
                    </DialogDescription>
                </DialogHeader>
                <AudioForm initialData={audio} onSubmit={onSubmit} onCancel={onClose} />
            </DialogContent>
        </Dialog>
    );
}
