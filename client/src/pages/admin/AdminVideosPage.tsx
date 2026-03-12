import { useState, useMemo } from "react";
import { Video as VideoIcon, Plus, RefreshCw } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import VideoList from "@/components/VideoList";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import UploadVideoDialog from "@/components/UploadVideoDialog";
import DeleteDialog from "@/components/DeleteDialog";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { useVideos } from "@/hooks/useVideos";
import AdminLayout from "@/components/admin/AdminLayout";
import type { VideoItem } from "@/types/video.types";

export default function AdminVideosPage() {
    const { videos, loading, error, addVideo, updateVideo, removeVideo, fetchVideos } = useVideos();

    const [uploadOpen, setUploadOpen] = useState(false);
    const [editVideoItem, setEditVideoItem] = useState<VideoItem | undefined>(undefined);
    const [deleteVideoItem, setDeleteVideoItem] = useState<VideoItem | null>(null);
    const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredVideos = useMemo(() => {
        if (!searchQuery.trim()) return videos;
        const query = searchQuery.toLowerCase();
        return videos.filter(video => video.name.toLowerCase().includes(query));
    }, [videos, searchQuery]);

    const handleAddSubmit = async (name: string, video: File | undefined, startTime: number, endTime: number, isPrivate: boolean, accessKey: string, onProgress?: (progress: number) => void, thumbnail?: File): Promise<boolean> => {
        if (!video) return false;
        return addVideo({ name, video, startTime, endTime, isPrivate, accessKey, onProgress, thumbnail });
    };

    const handleEditSubmit = async (name: string, video: File | undefined, startTime: number, endTime: number, isPrivate: boolean, accessKey: string, onProgress?: (progress: number) => void, thumbnail?: File): Promise<boolean> => {
        if (!editVideoItem) return false;
        return updateVideo({
            id: editVideoItem.id,
            name,
            video,
            startTime,
            endTime,
            isPrivate,
            accessKey,
            onProgress,
            thumbnail
        });
    };

    const openEdit = (video: VideoItem) => setEditVideoItem(video);
    const closeEdit = () => setEditVideoItem(undefined);
    const openDelete = (video: VideoItem) => setDeleteVideoItem(video);
    const closeDelete = () => setDeleteVideoItem(null);

    const handlePlayToggle = (video: VideoItem) => {
        if (playingVideo?.id === video.id) {
            setIsPaused(!isPaused);
        } else {
            setPlayingVideo(video);
            setIsPaused(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-wider mb-4">
                            <VideoIcon className="w-3 h-3" />
                            Video Library
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white italic uppercase">Manage Videos</h1>
                        <p className="text-muted-foreground text-sm mt-1">Upload, edit and manage comedy video clips</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="w-full md:w-80"
                        />
                        <Button
                            onClick={() => setUploadOpen(true)}
                            className="bg-orange-600 hover:bg-orange-500 text-white font-bold gap-2 px-6 rounded-xl shadow-lg shadow-orange-900/20"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Add Video</span>
                        </Button>
                    </div>
                </div>

                <div className="border-t border-white/5" />

                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-muted-foreground">{error}</p>
                        <Button variant="outline" onClick={fetchVideos} className="border-white/10 rounded-xl gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </Button>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <EmptyState onAddClick={() => setUploadOpen(true)} />
                ) : (
                    <VideoList
                        videos={filteredVideos}
                        currentPlayingId={playingVideo?.id ?? null}
                        isPaused={isPaused}
                        onPlay={handlePlayToggle}
                        onEdit={openEdit}
                        onDelete={openDelete}
                    />
                )}
            </div>

            {/* Dialogs */}
            <UploadVideoDialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onSubmit={handleAddSubmit}
            />

            <UploadVideoDialog
                open={!!editVideoItem}
                video={editVideoItem}
                onClose={closeEdit}
                onSubmit={handleEditSubmit}
            />

            <DeleteDialog
                open={!!deleteVideoItem}
                audio={deleteVideoItem}
                onClose={closeDelete}
                onConfirm={removeVideo}
            />

            {/* Video Player */}
            {playingVideo && (
                <VideoPlayer
                    video={playingVideo}
                    isPaused={isPaused}
                    onTogglePause={() => setIsPaused(!isPaused)}
                    onClose={() => setPlayingVideo(null)}
                />
            )}
        </AdminLayout>
    );
}
