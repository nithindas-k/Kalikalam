import { useState, useMemo } from "react";
import { Mic2, Plus, RefreshCw } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import AudioList from "@/components/AudioList";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import UploadDialog from "@/components/UploadDialog";
import DeleteDialog from "@/components/DeleteDialog";
import AudioPlayer from "@/components/AudioPlayer";
import { Button } from "@/components/ui/button";
import { useAudios } from "@/hooks/useAudios";
import AdminLayout from "@/components/admin/AdminLayout";
import type { AudioItem, CreateAudioPayload, UpdateAudioPayload } from "@/types/audio.types";

export default function AdminAudiosPage() {
    const { audios, loading, error, addAudio, editAudio, removeAudio, fetchAudios } = useAudios();

    const [uploadOpen, setUploadOpen] = useState(false);
    const [editAudioItem, setEditAudioItem] = useState<AudioItem | undefined>(undefined);
    const [deleteAudioItem, setDeleteAudioItem] = useState<AudioItem | null>(null);
    const [playingAudio, setPlayingAudio] = useState<AudioItem | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredAudios = useMemo(() => {
        if (!searchQuery.trim()) return audios;
        const query = searchQuery.toLowerCase();
        return audios.filter(audio =>
            audio.name.toLowerCase().includes(query)
        );
    }, [audios, searchQuery]);

    const handleAddSubmit = async (name: string, image: File | null, audio: File | null, isPrivate: boolean, accessKey: string): Promise<boolean> => {
        if (!image || !audio) return false;
        const payload: CreateAudioPayload = { name, image, audio, isPrivate, accessKey };
        return addAudio(payload);
    };

    const handleEditSubmit = async (name: string, image: File | null, audio: File | null, _isPrivate: boolean, _accessKey: string): Promise<boolean> => {
        if (!editAudioItem) return false;
        const payload: UpdateAudioPayload = { name };
        if (image) payload.image = image;
        if (audio) payload.audio = audio;
        return editAudio(editAudioItem.id, payload);
    };

    const openEdit = (audio: AudioItem) => setEditAudioItem(audio);
    const closeEdit = () => setEditAudioItem(undefined);
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
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-wider mb-4">
                            <Mic2 className="w-3 h-3" />
                            Audio Library
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white italic uppercase">Manage Audios</h1>
                        <p className="text-muted-foreground text-sm mt-1">Upload, edit and manage comedy audio clips</p>
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
                            <span className="hidden sm:inline">Add Clip</span>
                        </Button>
                    </div>
                </div>

                <div className="border-t border-white/5" />

                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-muted-foreground">{error}</p>
                        <Button variant="outline" onClick={fetchAudios} className="border-white/10 rounded-xl gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </Button>
                    </div>
                ) : filteredAudios.length === 0 ? (
                    <EmptyState onAddClick={() => setUploadOpen(true)} />
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
            </div>

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
        </AdminLayout>
    );
}
