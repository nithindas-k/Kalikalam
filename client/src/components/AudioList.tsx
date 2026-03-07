import AudioCard from "@/components/AudioCard";
import type { AudioItem } from "@/types/audio.types";

interface AudioListProps {
    audios: AudioItem[];
    currentPlayingId: string | null;
    isPaused: boolean;
    onPlay: (audio: AudioItem) => void;
    onEdit: (audio: AudioItem) => void;
    onDelete: (audio: AudioItem) => void;
}

export default function AudioList({ audios, currentPlayingId, isPaused, onPlay, onEdit, onDelete }: AudioListProps) {
    return (
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6 md:p-6">
            {audios.map((audio) => (
                <AudioCard
                    key={audio.id}
                    audio={audio}
                    isActive={currentPlayingId === audio.id}
                    isPlaying={currentPlayingId === audio.id && !isPaused}
                    onPlay={onPlay}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
