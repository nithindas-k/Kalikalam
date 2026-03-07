import { useState } from "react";
import { Mic2, Plus, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import AudioList from "@/components/AudioList";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import UploadDialog from "@/components/UploadDialog";
import DeleteDialog from "@/components/DeleteDialog";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useAudios } from "@/hooks/useAudios";
import type { AudioItem, CreateAudioPayload, UpdateAudioPayload } from "@/types/audio.types";

export default function AudiosPage() {
    const { audios, loading, error, addAudio, editAudio, removeAudio, fetchAudios } = useAudios();

    const [uploadOpen, setUploadOpen] = useState(false);
    const [editAudioItem, setEditAudioItem] = useState<AudioItem | undefined>(undefined);
    const [deleteAudioItem, setDeleteAudioItem] = useState<AudioItem | null>(null);
    const [playingAudio, setPlayingAudio] = useState<AudioItem | null>(null);

    // Add
    const handleAddSubmit = async (name: string, image: File | null, audio: File | null): Promise<boolean> => {
        if (!image || !audio) return false;
        const payload: CreateAudioPayload = { name, image, audio };
        return addAudio(payload);
    };

    // Edit
    const handleEditSubmit = async (name: string, image: File | null, audio: File | null): Promise<boolean> => {
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
            setPlayingAudio(null);
        } else {
            setPlayingAudio(audio);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <Navbar onAddClick={() => setUploadOpen(true)} />

            {/* Page header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Mic2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Comedy Clips</h1>
                        {!loading && !error && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {audios.length} {audios.length === 1 ? "clip" : "clips"}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchAudios}
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => setUploadOpen(true)} className="h-9 px-3 sm:px-4 gap-2 font-bold orange-glow-sm">
                        <Plus className="w-4 h-4" />
                        <span className="hidden xs:inline">Add</span>
                    </Button>
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
                <EmptyState onAddClick={() => setUploadOpen(true)} />
            ) : (
                <AudioList
                    audios={audios}
                    currentPlayingId={playingAudio?.id ?? null}
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
                <AudioPlayer audio={playingAudio} onClose={() => setPlayingAudio(null)} />
            )}
        </div>
    );
}
