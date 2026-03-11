import { useState, useMemo } from "react";
import { Video as VideoIcon, Plus, RefreshCw, Search } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import Navbar from "@/components/Navbar";
import VideoList from "@/components/VideoList";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import UploadVideoDialog from "@/components/UploadVideoDialog";
import DeleteDialog from "@/components/DeleteDialog";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { useVideos } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";
import type { VideoItem } from "@/types/video.types";

export default function VideosPage() {
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
        <div className="min-h-screen bg-background pb-24">
            <Navbar onAddClick={() => setUploadOpen(true)} />

            {/* Page header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                <VideoIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Video Clips</h1>
                                {!loading && !error && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        {filteredVideos.length} {filteredVideos.length === 1 ? "video" : "videos"}
                                        {searchQuery && ` found for "${searchQuery}"`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Mobile buttons */}
                        <div className="flex sm:hidden items-center gap-1.5">
                            <Button variant="ghost" size="icon" onClick={fetchVideos} className="h-9 w-9 text-muted-foreground hover:text-foreground">
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </Button>
                            <Button onClick={() => setUploadOpen(true)} className="h-9 px-3 gap-2 font-bold transition-transform active:scale-95">
                                <Plus className="w-4 h-4" />
                                <span className="hidden xs:inline">Add</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <SearchInput value={searchQuery} onChange={setSearchQuery} className="flex-1 sm:w-64 md:w-80" />

                        {/* Desktop buttons */}
                        <div className="hidden sm:flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={fetchVideos} className="h-9 w-9 text-muted-foreground hover:text-foreground">
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </Button>
                            <Button onClick={() => setUploadOpen(true)} className="h-9 px-4 gap-2 font-bold transition-transform active:scale-95">
                                <Plus className="w-4 h-4" />
                                <span>Add Video</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Content */}
            {loading ? (
                <LoadingSkeleton />
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <p className="text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={fetchVideos} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                </div>
            ) : videos.length === 0 ? (
                <EmptyState onAddClick={() => setUploadOpen(true)} />
            ) : filteredVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-border/50 shadow-sm transition-transform hover:scale-105 duration-300">
                        <Search className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2">No results for "{searchQuery}"</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                        We couldn't find any videos that match your search. Check your spelling or try another keyword.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => setSearchQuery("")}
                        className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 group"
                    >
                        <RefreshCw className="w-4 h-4 mr-2 text-primary/70 group-hover:rotate-180 transition-transform duration-500" />
                        Clear Search
                    </Button>
                </div>
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

            {playingVideo && (
                <VideoPlayer
                    video={playingVideo}
                    isPaused={isPaused}
                    onTogglePause={() => setIsPaused(!isPaused)}
                    onClose={() => setPlayingVideo(null)}
                />
            )}
        </div>
    );
}
