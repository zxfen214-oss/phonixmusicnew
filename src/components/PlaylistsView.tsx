import { useState } from "react";
import { useLibrary } from "@/contexts/LibraryContext";
import { PlaylistCard } from "./PlaylistCard";
import { CreatePlaylistDialog } from "./CreatePlaylistDialog";
import { PlaylistDetailView } from "./PlaylistDetailView";
import { Plus, ListMusic } from "lucide-react";

export function PlaylistsView() {
  const { playlists } = useLibrary();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const selectedPlaylist = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId) ?? null
    : null;

  if (selectedPlaylist) {
    return (
      <PlaylistDetailView
        playlist={selectedPlaylist}
        onBack={() => setSelectedPlaylistId(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-8 py-6 border-b border-border/60 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-animated inline-block">Playlists</h1>
          <p className="text-muted-foreground text-sm mt-1 hidden sm:block">Your curated collections</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-brand text-white font-medium text-sm shadow-glow hover:opacity-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Playlist</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-brand rounded-full blur-2xl opacity-30 animate-pulse-glow" />
              <div className="relative h-20 w-20 rounded-full glass-strong flex items-center justify-center">
                <ListMusic className="h-9 w-9 text-accent" />
              </div>
            </div>
            <p className="text-foreground text-lg font-semibold">No playlists yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Create your first playlist to organize your music
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-brand text-white font-medium text-sm shadow-glow"
            >
              <Plus className="h-4 w-4" />
              Create Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onOpen={() => setSelectedPlaylistId(playlist.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePlaylistDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
