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
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 md:p-6">
            {videos.map((video) => (
                <VideoCard
                    key={video.id}
                    video={video}
                    isActive={currentPlayingId === video.id}
                    isPlaying={currentPlayingId === video.id && !isPaused}
                    onPlay={onPlay}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
