import { Mic2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MESSAGES } from "@/constants/messages";

interface EmptyStateProps {
    onAddClick: () => void;
}

export default function EmptyState({ onAddClick }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <Mic2 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Clips Yet</h3>
            <p className="text-muted-foreground mb-8 max-w-xs">{MESSAGES.EMPTY_STATE}</p>
            <Button onClick={onAddClick} className="gap-2 font-semibold">
                <Plus className="w-4 h-4" />
                Add First Clip
            </Button>
        </div>
    );
}
