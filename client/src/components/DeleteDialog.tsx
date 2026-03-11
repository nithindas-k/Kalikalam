import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { MESSAGES } from "@/constants/messages";

interface DeleteDialogProps {
    open: boolean;
    audio: { id: string, name: string } | null;
    onClose: () => void;
    onConfirm: (id: string) => Promise<boolean>;
}

export default function DeleteDialog({ open, audio, onClose, onConfirm }: DeleteDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!audio) return;
        setLoading(true);
        await onConfirm(audio.id);
        setLoading(false);
        onClose();
    };

    return (
        <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
            <AlertDialogContent className="max-w-[90vw] rounded-2xl p-6 sm:max-w-md">
                <AlertDialogHeader className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <Trash2 className="w-6 h-6 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-xl font-bold">Delete "{audio?.name}"?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                        {MESSAGES.CONFIRM_DELETE}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0 mt-2">
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1 sm:order-2"
                    >
                        {loading ? "Deleting..." : "Yes, Delete"}
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={onClose}
                        disabled={loading}
                        className="w-full mt-0 order-2 sm:order-1"
                    >
                        Cancel
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
