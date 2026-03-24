import { useState, useMemo } from "react";
import { Mic2, Plus, RefreshCw, Search } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import Navbar from "@/components/Navbar";
import AudioList from "@/components/AudioList";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import UploadDialog from "@/components/UploadDialog";
import DeleteDialog from "@/components/DeleteDialog";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useAudios } from "@/hooks/useAudios";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { AudioItem, CreateAudioPayload, UpdateAudioPayload } from "@/types/audio.types";

export default function AudiosPage() {
    const { audios, loading, error, addAudio, editAudio, removeAudio, fetchAudios } = useAudios();
    const { user } = useAuth(); // 🔒 Auth guard uploads

    const [uploadOpen, setUploadOpen] = useState(false);
    const [editAudioItem, setEditAudioItem] = useState<AudioItem | undefined>(undefined);
    const [deleteAudioItem, setDeleteAudioItem] = useState<AudioItem | null>(null);
    const [playingAudio, setPlayingAudio] = useState<AudioItem | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleAddClick = () => {
        if (!user) {
            toast.error("Please log in to upload clips!");
            return;
        }
        setUploadOpen(true);
    };

    // Filter audios based on search query
    const filteredAudios = useMemo(() => {
        if (!searchQuery.trim()) return audios;
        const query = searchQuery.toLowerCase();
        return audios.filter(audio =>
            audio.name.toLowerCase().includes(query)
        );
    }, [audios, searchQuery]);

    // Add
    const handleAddSubmit = async (name: string, image: File | null, audio: File | null, isPrivate: boolean, accessKey: string): Promise<boolean> => {
        if (!image || !audio) return false;
        const payload: CreateAudioPayload = { name, image, audio, isPrivate, accessKey };
        return addAudio(payload);
    };

    // Edit
    const handleEditSubmit = async (name: string, image: File | null, audio: File | null, _isPrivate: boolean, _accessKey: string): Promise<boolean> => {
        if (!editAudioItem) return false;
        const payload: UpdateAudioPayload = { name };
        if (image) payload.image = image;
        if (audio) payload.audio = audio;
        return editAudio(editAudioItem.id, payload);
    };

    const openEdit = (audio: AudioItem) => {
        setEditAudioItem(audio);
    };
    const closeEdit = () => setEditAudioItem(undefined);

    // Delete
    const openDelete = (audio: AudioItem) => setDeleteAudioItem(audio);
    const closeDelete = () => setDeleteAudioItem(null);

    const handlePlayToggle = (audio: AudioItem) => {
        if (playingAudio?.id === audio.id) {
            setIsPaused(!isPaused);
        } else {
            setPlayingAudio(audio);
            setIsPaused(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <Navbar />

            {/* Page header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                <Mic2 className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Comedy Clips</h1>
                                {!loading && !error && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        {filteredAudios.length} {filteredAudios.length === 1 ? "clip" : "clips"}
                                        {searchQuery && ` found for "${searchQuery}"`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Mobile buttons */}
                        <div className="flex sm:hidden items-center gap-1.5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchAudios}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </Button>
                            <Button onClick={handleAddClick} className="h-9 px-3 gap-2 font-bold transition-transform active:scale-95">
                                <Plus className="w-4 h-4" />
                                <span>Add</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="flex-1 sm:w-64 md:w-80"
                        />

                        {/* Desktop buttons */}
                        <div className="hidden sm:flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchAudios}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </Button>
                            <Button onClick={handleAddClick} className="h-9 px-4 gap-2 font-bold transition-transform active:scale-95">
                                <Plus className="w-4 h-4" />
                                <span>Add Clip</span>
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
                    <Button variant="outline" onClick={fetchAudios} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                </div>
            ) : audios.length === 0 ? (
                <EmptyState onAddClick={handleAddClick} />
            ) : filteredAudios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-border/50 shadow-sm transition-transform hover:scale-105 duration-300">
                        <Search className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2">No results for "{searchQuery}"</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                        We couldn't find any clips that match your search. Check your spelling or try another keyword.
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
                <AudioList
                    audios={filteredAudios}
                    currentPlayingId={playingAudio?.id ?? null}
                    isPaused={isPaused}
                    onPlay={handlePlayToggle}
                    onEdit={openEdit}
                    onDelete={openDelete}
                />
            )}

            {/* Dialogs */}
            <UploadDialog
                open={uploadOpen}
                mode="add"
                onClose={() => setUploadOpen(false)}
                onSubmit={handleAddSubmit}
            />

            <UploadDialog
                open={!!editAudioItem}
                mode="edit"
                audio={editAudioItem}
                onClose={closeEdit}
                onSubmit={handleEditSubmit}
            />

            <DeleteDialog
                open={!!deleteAudioItem}
                audio={deleteAudioItem}
                onClose={closeDelete}
                onConfirm={removeAudio}
            />

            {/* Floating player */}
            {playingAudio && (
                <AudioPlayer
                    audio={playingAudio}
                    isPaused={isPaused}
                    onTogglePause={() => setIsPaused(!isPaused)}
                    onClose={() => setPlayingAudio(null)}
                />
            )}
        </div>
    );
}
