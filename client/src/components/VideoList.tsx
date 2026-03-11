import VideoCard from "@/components/VideoCard";
import type { VideoItem } from "@/types/video.types";

interface VideoListProps {
    videos: VideoItem[];
    currentPlayingId: string | null;
    isPaused: boolean;
    onPlay: (video: VideoItem) => void;
    onEdit: (video: VideoItem) => void;
    onDelete: (video: VideoItem) => void;
}

export default function VideoList({ videos, currentPlayingId, isPaused, onPlay, onEdit, onDelete }: VideoListProps) {
    return (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 p-4 md:gap-6 md:p-6 space-y-4 md:space-y-6">
            {videos.map((video, index) => (
                <div
                    key={video.id}
                    className="break-inside-avoid shadow-lg rounded-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <VideoCard
                        video={video}
                        isActive={currentPlayingId === video.id}
                        isPlaying={currentPlayingId === video.id && !isPaused}
                        onPlay={onPlay}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </div>
            ))}
        </div>
    );
}
